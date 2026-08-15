const sendSuccess = (res, message, data = null, statusCode = 200, extra = {}) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json({ ...payload, ...extra });
};

const sendError = (res, message, statusCode = 400, extra = {}) => {
  return res.status(statusCode).json({ success: false, message, ...extra });
};

module.exports = {
  sendSuccess,
  sendError
};
