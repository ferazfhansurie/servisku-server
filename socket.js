const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track online users: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // User joins with their userId
    socket.on('join', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`[Socket] User ${userId} joined`);
    });

    // Contractor joins their location room for HELP! broadcasts
    socket.on('contractor:join_area', ({ lat, lng }) => {
      // Join a geohash-based room (simplified: round to 1 decimal)
      const areaKey = `area:${Math.round(lat * 10) / 10},${Math.round(lng * 10) / 10}`;
      socket.join(areaKey);
      socket.areaKey = areaKey;
    });

    // Contractor goes online/offline
    socket.on('contractor:online', (contractorId) => {
      socket.join(`contractor:${contractorId}`);
      io.emit('contractor:status', { contractorId, online: true });
    });

    socket.on('contractor:offline', (contractorId) => {
      socket.leave(`contractor:${contractorId}`);
      io.emit('contractor:status', { contractorId, online: false });
    });

    // Chat: join a chat room
    socket.on('chat:join', (roomId) => {
      socket.join(`chat:${roomId}`);
    });

    // Chat: typing indicator
    socket.on('chat:typing', ({ roomId, userId }) => {
      socket.to(`chat:${roomId}`).emit('chat:typing', { roomId, userId });
    });

    // Location updates during active booking
    socket.on('location:update', ({ bookingId, lat, lng }) => {
      io.to(`booking:${bookingId}`).emit('location:update', { bookingId, lat, lng });
    });

    // Join booking room for live updates
    socket.on('booking:join', (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
