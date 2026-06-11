const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);

router.get('/:id', [param('id').isUUID()], validate, controller.getById);

router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Title is required (max 200 chars)'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('blamedTeamId').isUUID().withMessage('Valid blamed team ID is required'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
    body('impactDescription').trim().notEmpty().withMessage('Impact description is required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('estimatedHoursLost').optional({ nullable: true }).isFloat({ min: 0 }),
    body('employeesAffected').optional({ nullable: true }).isInt({ min: 0 }),
    body('businessImpactNotes').optional().trim(),
  ],
  validate,
  controller.create
);

router.patch(
  '/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['OPEN', 'IN_DISCUSSION', 'BLOCKED', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  ],
  validate,
  controller.updateStatus
);

router.patch('/:id', [param('id').isUUID()], validate, controller.update);

router.delete('/:id', [param('id').isUUID()], validate, authorize('ADMIN'), controller.delete);

module.exports = router;
