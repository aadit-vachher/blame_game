const { Router } = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const controller = require('./controller');

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', controller.list);

module.exports = router;
