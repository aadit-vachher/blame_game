const analyticsService = require('./service');

class AnalyticsController {
  async overview(req, res, next) {
    try {
      const data = await analyticsService.overview();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async teams(req, res, next) {
    try {
      const data = await analyticsService.teams();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async categories(req, res, next) {
    try {
      const data = await analyticsService.categories();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async productivity(req, res, next) {
    try {
      const data = await analyticsService.productivity();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async trends(req, res, next) {
    try {
      const months = parseInt(req.query.months) || 6;
      const data = await analyticsService.trends({ months });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

module.exports = new AnalyticsController();
