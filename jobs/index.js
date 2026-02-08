const { Queue, Worker } = require('bullmq');
const db = require('../db');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = { url: REDIS_URL };

// Queues
const bookingQueue = new Queue('booking', { connection });
const notificationQueue = new Queue('notification', { connection });
const paymentQueue = new Queue('payment', { connection });

// Workers
const bookingWorker = new Worker('booking', async (job) => {
  switch (job.name) {
    case 'reminder': {
      // Send reminder 1hr before scheduled booking
      const { booking_id } = job.data;
      const booking = await db.getRow('SELECT * FROM bookings WHERE id = $1', [booking_id]);
      if (booking && booking.status === 'accepted') {
        await db.insertRow(
          'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [booking.user_id, 'Booking Reminder', `Your booking ${booking.booking_number} is coming up soon!`, 'booking_update', JSON.stringify({ booking_id })]
        );
      }
      break;
    }

    case 'bid_expiry': {
      // Expire HELP! bids after 15 minutes
      const { booking_id } = job.data;
      await db.query(
        "UPDATE booking_bids SET status = 'expired' WHERE booking_id = $1 AND status = 'pending' AND created_at < NOW() - interval '15 minutes'",
        [booking_id]
      );
      break;
    }

    case 'review_reminder': {
      // Prompt user to review 2hrs after completion
      const { booking_id, user_id } = job.data;
      const review = await db.getRow('SELECT id FROM reviews WHERE booking_id = $1', [booking_id]);
      if (!review) {
        await db.insertRow(
          'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [user_id, 'How was your service?', 'Please take a moment to leave a review!', 'review_reminder', JSON.stringify({ booking_id })]
        );
      }
      break;
    }
  }
}, { connection });

const paymentWorker = new Worker('payment', async (job) => {
  switch (job.name) {
    case 'release_payout': {
      // Release contractor payout after 24hr hold
      const { payment_id } = job.data;
      await db.updateRow(
        "UPDATE payments SET status = 'released', released_at = NOW() WHERE id = $1 AND status = 'captured' RETURNING *",
        [payment_id]
      );
      break;
    }
  }
}, { connection });

// Error handlers
bookingWorker.on('failed', (job, err) => {
  console.error(`[Job] booking:${job.name} failed:`, err.message);
});

paymentWorker.on('failed', (job, err) => {
  console.error(`[Job] payment:${job.name} failed:`, err.message);
});

// Helper to schedule jobs
async function scheduleBookingReminder(bookingId, scheduledDate, scheduledTime) {
  if (!scheduledDate || !scheduledTime) return;
  const dt = new Date(`${scheduledDate}T${scheduledTime}`);
  const reminderTime = new Date(dt.getTime() - 60 * 60 * 1000); // 1hr before
  const delay = Math.max(0, reminderTime.getTime() - Date.now());

  await bookingQueue.add('reminder', { booking_id: bookingId }, { delay });
}

async function scheduleBidExpiry(bookingId) {
  await bookingQueue.add('bid_expiry', { booking_id: bookingId }, { delay: 15 * 60 * 1000 }); // 15 min
}

async function scheduleReviewReminder(bookingId, userId) {
  await bookingQueue.add('review_reminder', { booking_id: bookingId, user_id: userId }, { delay: 2 * 60 * 60 * 1000 }); // 2hrs
}

async function schedulePayoutRelease(paymentId) {
  await paymentQueue.add('release_payout', { payment_id: paymentId }, { delay: 24 * 60 * 60 * 1000 }); // 24hrs
}

module.exports = {
  bookingQueue,
  notificationQueue,
  paymentQueue,
  scheduleBookingReminder,
  scheduleBidExpiry,
  scheduleReviewReminder,
  schedulePayoutRelease,
};
