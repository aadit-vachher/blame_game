const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);

router.post(
  '/',
  authorize('ADMIN'),
  [body('name').trim().notEmpty().withMessage('Category name is required')],
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

router.delete('/:id', authorize('ADMIN'), [param('id').isUUID()], validate, controller.deactivate);

module.exports = router;
