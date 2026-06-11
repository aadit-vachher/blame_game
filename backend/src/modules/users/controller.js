const userService = require('./service');

class UserController {
  async list(req, res, next) {
    try {
      const { page, limit, search, teamId, role, status } = req.query;
      const result = await userService.list({
        page: parseInt(page) || 1,
        limit: Math.min(parseInt(limit) || 20, 100),
        search, teamId, role, status,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body, req.user.id, req.ip);
      res.status(201).json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const user = await userService.update(req.params.id, req.body, req.user.id, req.ip);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async disable(req, res, next) {
    try {
      await userService.disable(req.params.id, req.user.id, req.ip);
      res.json({ success: true, message: 'User disabled' });
    } catch (error) { next(error); }
  }

  async enable(req, res, next) {
    try {
      await userService.enable(req.params.id, req.user.id, req.ip);
      res.json({ success: true, message: 'User enabled' });
    } catch (error) { next(error); }
  }

  async resetPassword(req, res, next) {
    try {
      await userService.resetPassword(req.params.id, req.body.newPassword, req.user.id, req.ip);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) { next(error); }
  }

  async transfer(req, res, next) {
    try {
      await userService.transfer(req.params.id, req.body.teamId, req.user.id, req.ip);
      res.json({ success: true, message: 'User transferred successfully' });
    } catch (error) { next(error); }
  }
}

module.exports = new UserController();
