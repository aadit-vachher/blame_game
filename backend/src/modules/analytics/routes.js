const { Router } = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.get('/leaderboard', controller.leaderboard);

router.use(authorize('ADMIN'));

router.get('/overview', controller.overview);
router.get('/teams', controller.teams);
router.get('/categories', controller.categories);
router.get('/productivity', controller.productivity);
router.get('/trends', controller.trends);

module.exports = router;
