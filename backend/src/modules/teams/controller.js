const teamService = require('./service');

class TeamController {
  async list(req, res, next) {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const teams = await teamService.list({ includeArchived });
      res.json({ success: true, data: teams });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const team = await teamService.getById(req.params.id);
      res.json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  async getMembers(req, res, next) {
    try {
      const members = await teamService.getMembers(req.params.id);
      res.json({ success: true, data: members });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const team = await teamService.create(req.body, req.user.id, req.ip);
      res.status(201).json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const team = await teamService.update(req.params.id, req.body, req.user.id, req.ip);
      res.json({ success: true, data: team });
    } catch (error) { next(error); }
  }

  async archive(req, res, next) {
    try {
      await teamService.archive(req.params.id, req.user.id, req.ip);
      res.json({ success: true, message: 'Team archived' });
    } catch (error) { next(error); }
  }
}

module.exports = new TeamController();
