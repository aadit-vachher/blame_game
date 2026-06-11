const prisma = require('../../config/database');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { createAuditLog } = require('../../utils/auditLogger');

class TeamService {
  async list({ includeArchived = false } = {}) {
    const where = includeArchived ? {} : { status: 'ACTIVE' };
    return prisma.team.findMany({
      where,
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { _count: { select: { members: true, blamesAgainst: true, blamesCreatedBy: true } } },
    });
    if (!team) throw new NotFoundError('Team');
    return team;
  }

  async getMembers(teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundError('Team');

    return prisma.user.findMany({
      where: { teamId, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, employeeId: true, role: true, status: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data, adminId, ipAddress) {
    const team = await prisma.team.create({
      data: { name: data.name, description: data.description },
    });

    await createAuditLog({
      action: 'TEAM_CREATED',
      userId: adminId,
      entityType: 'Team',
      entityId: team.id,
      newValue: { name: team.name },
      ipAddress,
    });

    return team;
  }

  async update(id, data, adminId, ipAddress) {
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Team');

    const team = await prisma.team.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });

    await createAuditLog({
      action: 'TEAM_UPDATED',
      userId: adminId,
      entityType: 'Team',
      entityId: id,
      oldValue: { name: existing.name, description: existing.description },
      newValue: { name: team.name, description: team.description },
      ipAddress,
    });

    return team;
  }

  async archive(id, adminId, ipAddress) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!team) throw new NotFoundError('Team');
    if (team._count.members > 0) {
      throw new ValidationError('Cannot archive a team with active members. Transfer members first.');
    }

    await prisma.team.update({ where: { id }, data: { status: 'ARCHIVED' } });

    await createAuditLog({
      action: 'TEAM_ARCHIVED',
      userId: adminId,
      entityType: 'Team',
      entityId: id,
      oldValue: { status: team.status },
      newValue: { status: 'ARCHIVED' },
      ipAddress,
    });
  }
}

module.exports = new TeamService();
