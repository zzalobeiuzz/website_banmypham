require('dotenv').config({ path: __dirname + '/../private.env' });
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { attachChatSocket } = require('./chat/chat.socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
});

attachChatSocket(io);

server.listen(PORT,"0.0.0.0", () => {
  console.log(`🚀 Server đang chạy tại http://0.0.0.0:${PORT}`);
});
