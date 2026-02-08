const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY?.trim()) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
}

function requireStripe(req, res, next) {
  if (!stripe) {
    return res.status(503).json({ success: false, error: 'Payment service unavailable' });
  }
  next();
}

// POST /api/payments/create-intent — Create PaymentIntent for a booking
router.post('/create-intent', authMiddleware, requireStripe, async (req, res) => {
  try {
    const { booking_id } = req.body;

    const booking = await db.getRow('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [booking_id, req.user.id]);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    const amount = booking.final_price || booking.quoted_price;
    if (!amount) return res.status(422).json({ success: false, error: 'No price set for this booking' });

    const amountInCents = Math.round(amount * 100);
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '15');
    const platformFee = Math.round(amountInCents * platformFeePercent / 100);

    // Get contractor's Stripe account for Connect
    let transferData = {};
    if (booking.contractor_id) {
      const contractor = await db.getRow('SELECT stripe_account_id FROM contractor_profiles WHERE id = $1', [booking.contractor_id]);
      if (contractor?.stripe_account_id) {
        transferData = {
          transfer_data: {
            destination: contractor.stripe_account_id,
            amount: amountInCents - platformFee,
          },
        };
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'myr',
      metadata: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        user_id: req.user.id,
      },
      ...transferData,
    });

    // Record payment
    await db.insertRow(
      `INSERT INTO payments (booking_id, user_id, contractor_id, amount, platform_fee, contractor_payout, stripe_payment_intent_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [booking.id, req.user.id, booking.contractor_id, amount, platformFee / 100, (amountInCents - platformFee) / 100, paymentIntent.id]
    );

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
});

// POST /api/payments/webhook — Stripe webhook
router.post('/webhook', requireStripe, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      try {
        await db.updateRow(
          `UPDATE payments SET status = 'captured', paid_at = NOW() WHERE stripe_payment_intent_id = $1 RETURNING *`,
          [pi.id]
        );
        // Update booking payment status
        if (pi.metadata.booking_id) {
          await db.updateRow(
            `UPDATE bookings SET updated_at = NOW() WHERE id = $1 RETURNING *`,
            [pi.metadata.booking_id]
          );
        }
        console.log(`[Payment] Captured: ${pi.id}`);
      } catch (error) {
        console.error('Webhook payment update error:', error);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      try {
        await db.updateRow(
          `UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = $1 RETURNING *`,
          [pi.id]
        );
      } catch (error) {
        console.error('Webhook payment failed update error:', error);
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }

  res.json({ received: true });
});

// GET /api/payments/history — Payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const payments = await db.getRows(
      `SELECT p.*, b.booking_number, b.description as booking_description
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limitNum, offset]
    );

    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payment history' });
  }
});

// POST /api/payments/contractor-onboard — Stripe Connect onboarding for contractors
router.post('/contractor-onboard', authMiddleware, requireStripe, async (req, res) => {
  try {
    const profile = await db.getRow('SELECT * FROM contractor_profiles WHERE user_id = $1', [req.user.id]);
    if (!profile) return res.status(404).json({ success: false, error: 'Contractor profile not found' });

    let accountId = profile.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'MY',
        email: req.user.email,
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await db.updateRow(
        'UPDATE contractor_profiles SET stripe_account_id = $1 WHERE id = $2 RETURNING *',
        [accountId, profile.id]
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/contractor/stripe-refresh`,
      return_url: `${process.env.FRONTEND_URL}/contractor/stripe-complete`,
      type: 'account_onboarding',
    });

    res.json({ success: true, url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe Connect onboarding:', error);
    res.status(500).json({ success: false, error: 'Failed to create onboarding link' });
  }
});

module.exports = router;
