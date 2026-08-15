const errorHandler = (err, req, res, next) => {
  console.error('\x1b[31m[Server Error]\x1b[0m', err.stack || err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = {
  errorHandler
};
