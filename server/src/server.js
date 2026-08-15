const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\x1b[32m🚀 [TiffinLink Server Running]\x1b[0m Listening on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m[Unhandled Promise Rejection]\x1b[0m', err);
});
