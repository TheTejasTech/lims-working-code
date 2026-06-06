const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join:department', (department) => {
      if (department) socket.join(`dept:${department}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

const emitEvent = (event, data, room = null) => {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitEvent };
