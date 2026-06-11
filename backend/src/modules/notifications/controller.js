const notificationService = require('./service');

class NotificationController {
  async list(req, res, next) {
    try {
      const result = await notificationService.list(req.user.id, {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100),
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async unreadCount(req, res, next) {
    try {
      const count = await notificationService.unreadCount(req.user.id);
      res.json({ success: true, data: { count } });
    } catch (error) { next(error); }
  }

  async markRead(req, res, next) {
    try {
      await notificationService.markRead(req.params.id, req.user.id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) { next(error); }
  }

  async markAllRead(req, res, next) {
    try {
      await notificationService.markAllRead(req.user.id);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) { next(error); }
  }
}

module.exports = new NotificationController();
