const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getIO } = require('../socket');

router.use(authMiddleware);

// POST /api/chat/start — Start or find existing chat with contractor
router.post('/start', async (req, res) => {
  try {
    const { contractor_id, service_id } = req.body;
    
    if (!contractor_id) {
      return res.status(422).json({ success: false, error: 'contractor_id is required' });
    }

    // Check if a chat room already exists between this user and contractor (without booking)
    let room = await db.getRow(
      `SELECT cr.*, 
              cp.business_name,
              cu.full_name as contractor_name, cu.avatar_url as contractor_avatar
       FROM chat_rooms cr
       LEFT JOIN contractor_profiles cp ON cp.id = cr.contractor_id
       LEFT JOIN users cu ON cu.id = cp.user_id
       WHERE cr.user_id = $1 AND cr.contractor_id = $2 AND cr.booking_id IS NULL`,
      [req.user.id, contractor_id]
    );

    if (!room) {
      // Create new chat room
      room = await db.insertRow(
        `INSERT INTO chat_rooms (user_id, contractor_id) VALUES ($1, $2) RETURNING *`,
        [req.user.id, contractor_id]
      );
      
      // Fetch additional info
      const contractorInfo = await db.getRow(
        `SELECT cp.business_name, u.full_name as contractor_name, u.avatar_url as contractor_avatar
         FROM contractor_profiles cp
         JOIN users u ON u.id = cp.user_id
         WHERE cp.id = $1`,
        [contractor_id]
      );
      
      room = { ...room, ...contractorInfo };
      
      // If service_id provided, add an initial system message
      if (service_id) {
        const service = await db.getRow('SELECT title FROM contractor_services WHERE id = $1', [service_id]);
        if (service) {
          await db.insertRow(
            `INSERT INTO chat_messages (room_id, sender_id, message, message_type)
             VALUES ($1, $2, $3, 'system') RETURNING *`,
            [room.id, req.user.id, `Inquiry about: ${service.title}`]
          );
          await db.updateRow(
            'UPDATE chat_rooms SET last_message = $1, last_message_at = NOW() WHERE id = $2',
            [`Inquiry about: ${service.title}`, room.id]
          );
        }
      }
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ success: false, error: 'Failed to start chat' });
  }
});

// GET /api/chat/rooms — List user's chat rooms
router.get('/rooms', async (req, res) => {
  try {
    let condition;
    const params = [];

    if (req.user.role === 'contractor') {
      const profile = await db.getRow('SELECT id FROM contractor_profiles WHERE user_id = $1', [req.user.id]);
      if (!profile) return res.json({ success: true, rooms: [] });
      condition = 'cr.contractor_id = $1';
      params.push(profile.id);
    } else {
      condition = 'cr.user_id = $1';
      params.push(req.user.id);
    }

    const rooms = await db.getRows(
      `SELECT cr.*,
              b.booking_number, b.status as booking_status,
              u.full_name as user_name, u.avatar_url as user_avatar,
              cu.full_name as contractor_name, cu.avatar_url as contractor_avatar,
              cp.business_name,
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.is_read = false AND cm.sender_id != $${params.length + 1}) as unread_count
       FROM chat_rooms cr
       LEFT JOIN bookings b ON b.id = cr.booking_id
       LEFT JOIN users u ON u.id = cr.user_id
       LEFT JOIN contractor_profiles cp ON cp.id = cr.contractor_id
       LEFT JOIN users cu ON cu.id = cp.user_id
       WHERE ${condition}
       ORDER BY COALESCE(cr.last_message_at, cr.created_at) DESC`,
      [...params, req.user.id]
    );

    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat rooms' });
  }
});

// GET /api/chat/rooms/:id/messages — Get messages
router.get('/rooms/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const messages = await db.getRows(
      `SELECT cm.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM chat_messages cm
       JOIN users u ON u.id = cm.sender_id
       WHERE cm.room_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limitNum, offset]
    );

    // Mark messages as read
    await db.query(
      'UPDATE chat_messages SET is_read = true WHERE room_id = $1 AND sender_id != $2 AND is_read = false',
      [req.params.id, req.user.id]
    );

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/rooms/:id/messages — Send message
router.post('/rooms/:id/messages', async (req, res) => {
  try {
    const { message, message_type = 'text', metadata } = req.body;

    if (!message && message_type === 'text') {
      return res.status(422).json({ success: false, error: 'message is required' });
    }

    const msg = await db.insertRow(
      `INSERT INTO chat_messages (room_id, sender_id, message, message_type, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, req.user.id, message, message_type, JSON.stringify(metadata || {})]
    );

    // Update chat room last message
    await db.updateRow(
      'UPDATE chat_rooms SET last_message = $1, last_message_at = NOW() WHERE id = $2 RETURNING *',
      [message_type === 'text' ? message.substring(0, 200) : `[${message_type}]`, req.params.id]
    );

    // Emit via Socket.io
    const io = getIO();
    io.to(`chat:${req.params.id}`).emit('chat:message', {
      ...msg,
      sender_name: req.user.full_name,
      sender_avatar: req.user.avatar_url,
    });

    // Send notification to other party
    const room = await db.getRow('SELECT * FROM chat_rooms WHERE id = $1', [req.params.id]);
    if (room) {
      let notifyUserId;
      if (req.user.role === 'contractor') {
        notifyUserId = room.user_id;
      } else {
        const cp = await db.getRow('SELECT user_id FROM contractor_profiles WHERE id = $1', [room.contractor_id]);
        if (cp) notifyUserId = cp.user_id;
      }
      if (notifyUserId) {
        await db.insertRow(
          'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [notifyUserId, `Message from ${req.user.full_name}`, message?.substring(0, 100) || `[${message_type}]`, 'chat_message', JSON.stringify({ room_id: req.params.id })]
        );
      }
    }

    res.status(201).json({ success: true, message: msg });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

module.exports = router;
