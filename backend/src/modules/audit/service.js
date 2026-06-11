const prisma = require('../../config/database');

class AuditService {
  async list({ page = 1, limit = 50, action, userId, entityType, dateFrom, dateTo }) {
    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

module.exports = new AuditService();
