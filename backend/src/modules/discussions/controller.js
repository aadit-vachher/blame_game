const discussionService = require('./service');

class DiscussionController {
  async listMessages(req, res, next) {
    try {
      const result = await discussionService.listMessages(req.params.blameId, {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 50, 100),
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async createMessage(req, res, next) {
    try {
      const message = await discussionService.createMessage(
        req.params.blameId,
        req.body.content,
        req.user,
        req.body.mentionedTeamIds
      );
      res.status(201).json({ success: true, data: message });
    } catch (error) { next(error); }
  }
}

module.exports = new DiscussionController();
