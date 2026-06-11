const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const { NotFoundError, ConflictError, ValidationError } = require('../../utils/errors');
const { createAuditLog } = require('../../utils/auditLogger');

class UserService {
  async list({ page = 1, limit = 20, search, teamId, role, status }) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (teamId) where.teamId = teamId;
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, employeeId: true,
          role: true, status: true, teamId: true, createdAt: true,
          team: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, employeeId: true,
        role: true, status: true, teamId: true, createdAt: true, updatedAt: true,
        team: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async create(data, adminId, ipAddress) {
    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        employeeId: data.employeeId,
        passwordHash,
        role: data.role || 'USER',
        teamId: data.teamId,
      },
      select: {
        id: true, name: true, email: true, employeeId: true,
        role: true, status: true, teamId: true, createdAt: true,
        team: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: 'USER_CREATED',
      userId: adminId,
      entityType: 'User',
      entityId: user.id,
      newValue: { name: user.name, email: user.email, role: user.role, teamId: user.teamId },
      ipAddress,
    });

    return user;
  }

  async update(id, data, adminId, ipAddress) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('User');

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.employeeId) updateData.employeeId = data.employeeId;
    if (data.role) updateData.role = data.role;
    if (data.teamId !== undefined) updateData.teamId = data.teamId;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, employeeId: true,
        role: true, status: true, teamId: true, createdAt: true,
        team: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: 'USER_UPDATED',
      userId: adminId,
      entityType: 'User',
      entityId: id,
      oldValue: { name: existing.name, email: existing.email, role: existing.role, teamId: existing.teamId },
      newValue: updateData,
      ipAddress,
    });

    return user;
  }

  async disable(id, adminId, ipAddress) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');
    if (user.id === adminId) throw new ValidationError('Cannot disable your own account');

    await prisma.user.update({ where: { id }, data: { status: 'DISABLED' } });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    await createAuditLog({
      action: 'USER_DISABLED',
      userId: adminId,
      entityType: 'User',
      entityId: id,
      oldValue: { status: user.status },
      newValue: { status: 'DISABLED' },
      ipAddress,
    });
  }

  async enable(id, adminId, ipAddress) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });

    await createAuditLog({
      action: 'USER_ENABLED',
      userId: adminId,
      entityType: 'User',
      entityId: id,
      oldValue: { status: user.status },
      newValue: { status: 'ACTIVE' },
      ipAddress,
    });
  }

  async resetPassword(id, newPassword, adminId, ipAddress) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    await createAuditLog({
      action: 'PASSWORD_RESET',
      userId: adminId,
      entityType: 'User',
      entityId: id,
      ipAddress,
    });
  }

  async transfer(id, newTeamId, adminId, ipAddress) {
    const [user, team] = await Promise.all([
      prisma.user.findUnique({ where: { id }, include: { team: true } }),
      prisma.team.findUnique({ where: { id: newTeamId } }),
    ]);

    if (!user) throw new NotFoundError('User');
    if (!team) throw new NotFoundError('Team');
    if (team.status === 'ARCHIVED') throw new ValidationError('Cannot transfer to an archived team');

    await prisma.user.update({ where: { id }, data: { teamId: newTeamId } });

    await createAuditLog({
      action: 'USER_TRANSFERRED',
      userId: adminId,
      entityType: 'User',
      entityId: id,
      oldValue: { teamId: user.teamId, teamName: user.team?.name },
      newValue: { teamId: newTeamId, teamName: team.name },
      ipAddress,
    });
  }
}

module.exports = new UserService();
