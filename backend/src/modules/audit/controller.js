const auditService = require('./service');

class AuditController {
  async list(req, res, next) {
    try {
      const result = await auditService.list({
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 50, 100),
        action: req.query.action,
        userId: req.query.userId,
        entityType: req.query.entityType,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

module.exports = new AuditController();
