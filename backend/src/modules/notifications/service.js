const prisma = require('../../config/database');

class NotificationService {
  async list(userId, { page = 1, limit = 20 }) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: { blame: { select: { id: true, title: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async unreadCount(userId) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id, userId) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

module.exports = new NotificationService();
