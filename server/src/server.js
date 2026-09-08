const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`\x1b[32m🚀 [TiffinLink Server & Socket.IO Running]\x1b[0m Listening on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m[Unhandled Promise Rejection]\x1b[0m', err);
});

