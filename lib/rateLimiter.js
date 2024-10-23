import rateLimit from 'express-rate-limit';

// Create a rate limiter that allows 5 requests per 15 minutes
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many requests, please try again after 15 minutes',
});

// Define and export the authRateLimiter function
export const authRateLimiter = (handler) => {
  return async (req, res) => {
    // Call the rate limiter middleware
    rateLimiter(req, res, (err) => {
      if (err) {
        return res.status(err.status || 500).json({ message: err.message });
      }
      // Call the next handler if allowed
      return handler(req, res);
    });
  };
};
