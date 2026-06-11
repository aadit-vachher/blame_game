const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.get('/chain/:blameId', [param('blameId').isUUID()], validate, controller.getChain);
router.get('/:blameId', [param('blameId').isUUID()], validate, controller.listForBlame);

router.post(
  '/:blameId',
  [
    param('blameId').isUUID(),
    body('blockedTeamId').isUUID().withMessage('Blocked team ID is required'),
    body('blockedByTeamId').isUUID().withMessage('Blocked by team ID is required'),
    body('reason').trim().notEmpty().isLength({ max: 500 }).withMessage('Reason is required (max 500 chars)'),
    body('notes').optional().trim(),
  ],
  validate,
  controller.create
);

router.delete('/:id', [param('id').isUUID()], validate, controller.remove);

module.exports = router;
