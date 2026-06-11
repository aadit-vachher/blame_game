const prisma = require('../../config/database');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../utils/errors');
const { STATUS_TRANSITIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/auditLogger');
const { notifyTeam } = require('../../utils/notifications');

class BlameService {
  async list({ page = 1, limit = 20, status, priority, categoryId, creatorTeamId, blamedTeamId, dateFrom, dateTo, hasDependencies, hasAttachments, search, sortBy = 'createdAt', sortOrder = 'desc' }) {
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (categoryId) where.categoryId = categoryId;
    if (creatorTeamId) where.creatorTeamId = creatorTeamId;
    if (blamedTeamId) where.blamedTeamId = blamedTeamId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (hasDependencies === 'true') {
      where.dependencies = { some: {} };
    }

    if (hasAttachments === 'true') {
      where.attachments = { some: {} };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSorts = ['createdAt', 'updatedAt', 'priority', 'status'];
    const orderField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [blames, total] = await Promise.all([
      prisma.blame.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          creatorTeam: { select: { id: true, name: true } },
          blamedTeam: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { messages: true, dependencies: true, attachments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: orderDir },
      }),
      prisma.blame.count({ where }),
    ]);

    return { blames, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id) {
    const blame = await prisma.blame.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, employeeId: true } },
        creatorTeam: { select: { id: true, name: true } },
        blamedTeam: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        messages: {
          include: {
            author: { select: { id: true, name: true, team: { select: { name: true } } } },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        dependencies: {
          include: {
            blockedTeam: { select: { id: true, name: true } },
            blockedByTeam: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          where: { messageId: null, dependencyId: null },
          include: { uploader: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { messages: true, dependencies: true, attachments: true } },
      },
    });

    if (!blame) throw new NotFoundError('Blame');
    return blame;
  }

  async create(data, user, ipAddress) {
    if (!user.teamId) {
      throw new ValidationError('You must belong to a team to create a blame');
    }

    if (user.teamId === data.blamedTeamId) {
      throw new ValidationError('Cannot blame your own team');
    }

    // Verify blamed team exists and is active
    const blamedTeam = await prisma.team.findUnique({ where: { id: data.blamedTeamId } });
    if (!blamedTeam || blamedTeam.status === 'ARCHIVED') {
      throw new ValidationError('Invalid or archived blamed team');
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) {
      throw new ValidationError('Invalid or inactive category');
    }

    const blame = await prisma.blame.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        impactDescription: data.impactDescription,
        estimatedHoursLost: data.estimatedHoursLost ? parseFloat(data.estimatedHoursLost) : null,
        employeesAffected: data.employeesAffected ? parseInt(data.employeesAffected) : null,
        businessImpactNotes: data.businessImpactNotes || null,
        creatorId: user.id,
        creatorTeamId: user.teamId,
        blamedTeamId: data.blamedTeamId,
        categoryId: data.categoryId,
      },
      include: {
        creator: { select: { id: true, name: true } },
        creatorTeam: { select: { id: true, name: true } },
        blamedTeam: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: 'BLAME_CREATED',
      userId: user.id,
      entityType: 'Blame',
      entityId: blame.id,
      newValue: { title: blame.title, priority: blame.priority, blamedTeamId: blame.blamedTeamId },
      ipAddress,
    });

    // Notify blamed team
    await notifyTeam({
      teamId: data.blamedTeamId,
      type: 'BLAME_ASSIGNED',
      title: 'New Blame Raised',
      message: `${user.name} from ${blame.creatorTeam.name} raised a blame: "${blame.title}"`,
      blameId: blame.id,
      excludeUserId: user.id,
    });

    return blame;
  }

  async updateStatus(id, newStatus, user, ipAddress) {
    const blame = await prisma.blame.findUnique({ where: { id } });
    if (!blame) throw new NotFoundError('Blame');

    const allowed = STATUS_TRANSITIONS[blame.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from ${blame.status} to ${newStatus}`);
    }

    // Only admin can reopen CLOSED blames
    if (blame.status === 'CLOSED' && newStatus === 'OPEN' && user.role !== 'ADMIN') {
      throw new ForbiddenError('Only admins can reopen closed blames');
    }

    const updated = await prisma.blame.update({
      where: { id },
      data: { status: newStatus },
    });

    await createAuditLog({
      action: 'BLAME_STATUS_CHANGED',
      userId: user.id,
      entityType: 'Blame',
      entityId: id,
      oldValue: { status: blame.status },
      newValue: { status: newStatus },
      ipAddress,
    });

    // Notify creator team and blamed team
    await notifyTeam({
      teamId: blame.creatorTeamId,
      type: 'STATUS_CHANGED',
      title: 'Blame Status Updated',
      message: `Blame "${blame.title}" status changed to ${newStatus}`,
      blameId: id,
      excludeUserId: user.id,
    });

    if (blame.blamedTeamId !== blame.creatorTeamId) {
      await notifyTeam({
        teamId: blame.blamedTeamId,
        type: 'STATUS_CHANGED',
        title: 'Blame Status Updated',
        message: `Blame "${blame.title}" status changed to ${newStatus}`,
        blameId: id,
        excludeUserId: user.id,
      });
    }

    return updated;
  }

  async update(id, data, user, ipAddress) {
    const blame = await prisma.blame.findUnique({ where: { id } });
    if (!blame) throw new NotFoundError('Blame');

    // Only creator or admin can edit
    if (blame.creatorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('Only the creator or an admin can edit this blame');
    }

    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.impactDescription) updateData.impactDescription = data.impactDescription;
    if (data.priority) updateData.priority = data.priority;
    if (data.estimatedHoursLost !== undefined) updateData.estimatedHoursLost = data.estimatedHoursLost ? parseFloat(data.estimatedHoursLost) : null;
    if (data.employeesAffected !== undefined) updateData.employeesAffected = data.employeesAffected ? parseInt(data.employeesAffected) : null;
    if (data.businessImpactNotes !== undefined) updateData.businessImpactNotes = data.businessImpactNotes;

    const updated = await prisma.blame.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true } },
        creatorTeam: { select: { id: true, name: true } },
        blamedTeam: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: 'BLAME_UPDATED',
      userId: user.id,
      entityType: 'Blame',
      entityId: id,
      oldValue: { title: blame.title, priority: blame.priority },
      newValue: updateData,
      ipAddress,
    });

    return updated;
  }
}

module.exports = new BlameService();
