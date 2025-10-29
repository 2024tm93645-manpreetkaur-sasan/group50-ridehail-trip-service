module.exports = {
  successResponse: (res, data = null, message = "Success", status = 200) => {
    return res.status(status).json({ message, data });
  },

  errorResponse: (res, message = "Error", status = 400) => {
    return res.status(status).json({ error: message });
  },
};