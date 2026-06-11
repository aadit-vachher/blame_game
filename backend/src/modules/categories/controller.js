const categoryService = require('./service');

class CategoryController {
  async list(req, res, next) {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const categories = await categoryService.list({ activeOnly });
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body, req.user.id, req.ip);
      res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body, req.user.id, req.ip);
      res.json({ success: true, data: category });
    } catch (error) { next(error); }
  }

  async deactivate(req, res, next) {
    try {
      await categoryService.deactivate(req.params.id, req.user.id, req.ip);
      res.json({ success: true, message: 'Category deactivated' });
    } catch (error) { next(error); }
  }
}

module.exports = new CategoryController();
