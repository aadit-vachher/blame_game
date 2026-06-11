const dependencyService = require('./service');

class DependencyController {
  async listForBlame(req, res, next) {
    try {
      const deps = await dependencyService.listForBlame(req.params.blameId);
      res.json({ success: true, data: deps });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const dep = await dependencyService.create(req.params.blameId, req.body, req.user, req.ip);
      res.status(201).json({ success: true, data: dep });
    } catch (error) { next(error); }
  }

  async remove(req, res, next) {
    try {
      await dependencyService.remove(req.params.id, req.user, req.ip);
      res.json({ success: true, message: 'Dependency removed' });
    } catch (error) { next(error); }
  }

  async getChain(req, res, next) {
    try {
      const chain = await dependencyService.getChain(req.params.blameId);
      res.json({ success: true, data: chain });
    } catch (error) { next(error); }
  }
}

module.exports = new DependencyController();
