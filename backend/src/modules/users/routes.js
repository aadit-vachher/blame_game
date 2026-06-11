const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const controller = require('./controller');

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', [param('id').isUUID()], validate, controller.getById);

// Admin-only routes
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('teamId').isUUID().withMessage('Valid team ID is required'),
    body('role').optional().isIn(['ADMIN', 'USER']).withMessage('Role must be ADMIN or USER'),
  ],
  validate,
  controller.create
);

router.patch(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID()],
  validate,
  controller.update
);

router.patch('/:id/disable', authorize('ADMIN'), [param('id').isUUID()], validate, controller.disable);
router.patch('/:id/enable', authorize('ADMIN'), [param('id').isUUID()], validate, controller.enable);

router.patch(
  '/:id/reset-password',
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  controller.resetPassword
);

router.patch(
  '/:id/transfer',
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('teamId').isUUID().withMessage('Valid team ID is required'),
  ],
  validate,
  controller.transfer
);

module.exports = router;
