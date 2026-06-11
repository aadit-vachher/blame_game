const attachmentService = require('./service');

class AttachmentController {
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }
      const attachment = await attachmentService.upload(req.file, req.user, {
        blameId: req.body.blameId,
        messageId: req.body.messageId,
        dependencyId: req.body.dependencyId,
      });
      res.status(201).json({ success: true, data: attachment });
    } catch (error) { next(error); }
  }

  async download(req, res, next) {
    try {
      const { attachment, filePath } = await attachmentService.download(req.params.id);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      res.setHeader('Content-Type', attachment.mimeType);
      res.sendFile(filePath, { root: process.cwd() });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await attachmentService.delete(req.params.id, req.user);
      res.json({ success: true, message: 'Attachment deleted' });
    } catch (error) { next(error); }
  }
}

module.exports = new AttachmentController();
