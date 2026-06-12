const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const controller = require('./controller');

const router = Router();

// Public routes
router.get('/', controller.list);

// Protected routes
router.use(authenticate);
router.get('/:id', [param('id').isUUID()], validate, controller.getById);
router.get('/:id/members', [param('id').isUUID()], validate, controller.getMembers);

router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Team name is required'),
    body('description').optional().trim(),
  ],
  validate,
  controller.create
);

router.patch(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID(), body('name').optional().trim().notEmpty()],
  validate,
  controller.update
);

router.patch('/:id/archive', authorize('ADMIN'), [param('id').isUUID()], validate, controller.archive);

module.exports = router;
