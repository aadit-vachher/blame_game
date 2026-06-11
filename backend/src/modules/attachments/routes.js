const { Router } = require('express');
const { param } = require('express-validator');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/authenticate');
const { upload } = require('../../middleware/upload');
const controller = require('./controller');

const router = Router();
router.use(authenticate);

router.post('/', upload.single('file'), controller.upload);
router.get('/:id', [param('id').isUUID()], validate, controller.download);
router.delete('/:id', [param('id').isUUID()], validate, controller.delete);

module.exports = router;
