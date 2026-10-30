function sendSuccess(res, statusCode, data, extra = {}) {
  return res.status(statusCode).json({ success: true, data, ...extra });
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { sendSuccess, sendError };
