/**
 * wrapper.js
 * Wraps async route handlers to forward errors to Express error middleware.
 * Usage: router.get('/path', wrapper(asyncHandler))
 */
const wrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = wrapper;
