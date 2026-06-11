const { Router } = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const controller = require('./controller');

const router = Router();

// Rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, code: 'RATE_LIMIT', message: 'Too many attempts. Try again later.' },
});

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  controller.refresh
);

router.post('/logout', authenticate, controller.logout);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  controller.changePassword
);

router.get('/me', authenticate, controller.me);

module.exports = router;
