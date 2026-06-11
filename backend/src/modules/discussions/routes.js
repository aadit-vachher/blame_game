const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.get('/:blameId/messages', [param('blameId').isUUID()], validate, controller.listMessages);

router.post(
  '/:blameId/messages',
  [
    param('blameId').isUUID(),
    body('content').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message content is required (max 5000 chars)'),
  ],
  validate,
  controller.createMessage
);

module.exports = router;
