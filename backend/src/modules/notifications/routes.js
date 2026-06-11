const { Router } = require('express');
const { param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', [param('id').isUUID()], validate, controller.markRead);

module.exports = router;
