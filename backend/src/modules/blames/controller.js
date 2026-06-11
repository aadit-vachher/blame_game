const blameService = require('./service');

class BlameController {
  async list(req, res, next) {
    try {
      const result = await blameService.list({
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100),
        status: req.query.status,
        priority: req.query.priority,
        categoryId: req.query.categoryId,
        creatorTeamId: req.query.creatorTeamId,
        blamedTeamId: req.query.blamedTeamId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        hasDependencies: req.query.hasDependencies,
        hasAttachments: req.query.hasAttachments,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const blame = await blameService.getById(req.params.id);
      res.json({ success: true, data: blame });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const blame = await blameService.create(req.body, req.user, req.ip);
      res.status(201).json({ success: true, data: blame });
    } catch (error) { next(error); }
  }

  async updateStatus(req, res, next) {
    try {
      const blame = await blameService.updateStatus(req.params.id, req.body.status, req.user, req.ip);
      res.json({ success: true, data: blame });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const blame = await blameService.update(req.params.id, req.body, req.user, req.ip);
      res.json({ success: true, data: blame });
    } catch (error) { next(error); }
  }
}

module.exports = new BlameController();
