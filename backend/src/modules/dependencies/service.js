const prisma = require('../../config/database');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { createAuditLog } = require('../../utils/auditLogger');
const { notifyTeam } = require('../../utils/notifications');

class DependencyService {
  async listForBlame(blameId) {
    const blame = await prisma.blame.findUnique({ where: { id: blameId } });
    if (!blame) throw new NotFoundError('Blame');

    return prisma.dependency.findMany({
      where: { blameId },
      include: {
        blockedTeam: { select: { id: true, name: true } },
        blockedByTeam: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(blameId, data, user, ipAddress) {
    const blame = await prisma.blame.findUnique({
      where: { id: blameId },
      select: { id: true, title: true, blamedTeamId: true, creatorTeamId: true },
    });
    if (!blame) throw new NotFoundError('Blame');

    if (data.blockedTeamId === data.blockedByTeamId) {
      throw new ValidationError('A team cannot be blocked by itself');
    }

    // Verify both teams exist
    const [blockedTeam, blockedByTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: data.blockedTeamId } }),
      prisma.team.findUnique({ where: { id: data.blockedByTeamId } }),
    ]);
    if (!blockedTeam || !blockedByTeam) throw new NotFoundError('Team');

    // Check for circular dependencies
    const isCircular = await this.detectCircularDependency(blameId, data.blockedByTeamId, data.blockedTeamId);
    if (isCircular) {
      throw new ValidationError('Circular dependency detected. This would create a dependency loop.');
    }

    const dependency = await prisma.dependency.create({
      data: {
        blameId,
        blockedTeamId: data.blockedTeamId,
        blockedByTeamId: data.blockedByTeamId,
        reason: data.reason,
        notes: data.notes || null,
        createdById: user.id,
      },
      include: {
        blockedTeam: { select: { id: true, name: true } },
        blockedByTeam: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      action: 'DEPENDENCY_ADDED',
      userId: user.id,
      entityType: 'Dependency',
      entityId: dependency.id,
      newValue: { blameId, blockedTeamId: data.blockedTeamId, blockedByTeamId: data.blockedByTeamId, reason: data.reason },
      ipAddress,
    });

    // Notify the blocking team
    await notifyTeam({
      teamId: data.blockedByTeamId,
      type: 'DEPENDENCY_ADDED',
      title: 'Dependency Added',
      message: `${blockedTeam.name} is blocked by your team on "${blame.title}"`,
      blameId,
      excludeUserId: user.id,
    });

    return dependency;
  }

  async remove(dependencyId, user, ipAddress) {
    const dep = await prisma.dependency.findUnique({
      where: { id: dependencyId },
      include: { blockedTeam: true, blockedByTeam: true },
    });
    if (!dep) throw new NotFoundError('Dependency');

    await prisma.dependency.delete({ where: { id: dependencyId } });

    await createAuditLog({
      action: 'DEPENDENCY_REMOVED',
      userId: user.id,
      entityType: 'Dependency',
      entityId: dependencyId,
      oldValue: {
        blameId: dep.blameId,
        blockedTeam: dep.blockedTeam.name,
        blockedByTeam: dep.blockedByTeam.name,
      },
      ipAddress,
    });
  }

  async getChain(blameId) {
    const blame = await prisma.blame.findUnique({
      where: { id: blameId },
      include: {
        creatorTeam: { select: { id: true, name: true } },
        blamedTeam: { select: { id: true, name: true } },
      },
    });
    if (!blame) throw new NotFoundError('Blame');

    const dependencies = await prisma.dependency.findMany({
      where: { blameId },
      include: {
        blockedTeam: { select: { id: true, name: true } },
        blockedByTeam: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build the chain
    const chain = this.buildChain(blame, dependencies);
    return chain;
  }

  buildChain(blame, dependencies) {
    const nodes = [];
    const visited = new Set();
    let isCircular = false;

    // Start with the creator team blaming the blamed team
    nodes.push({ team: blame.creatorTeam, type: 'creator', reason: 'Raised blame' });

    const buildFromTeam = (teamId, depth = 0) => {
      if (depth > 20) return; // Safety limit
      if (visited.has(teamId)) {
        isCircular = true;
        return;
      }
      visited.add(teamId);

      const dep = dependencies.find((d) => d.blockedTeamId === teamId);
      if (dep) {
        nodes.push({
          team: dep.blockedTeam,
          type: 'blocked',
          reason: dep.reason,
          blockedBy: dep.blockedByTeam,
        });
        buildFromTeam(dep.blockedByTeamId, depth + 1);
      }
    };

    // Start chain from blamed team
    const blamedDep = dependencies.find((d) => d.blockedTeamId === blame.blamedTeam.id);
    nodes.push({
      team: blame.blamedTeam,
      type: 'blamed',
      reason: blamedDep ? blamedDep.reason : null,
      blockedBy: blamedDep ? blamedDep.blockedByTeam : null,
    });

    if (blamedDep) {
      visited.add(blame.blamedTeam.id);
      buildFromTeam(blamedDep.blockedByTeamId);
    }

    // Add terminal nodes (teams that are blocking but not blocked)
    dependencies.forEach((dep) => {
      if (!nodes.find((n) => n.team.id === dep.blockedByTeamId)) {
        nodes.push({ team: dep.blockedByTeam, type: 'blocker', reason: null });
      }
    });

    return { nodes, dependencies, isCircular };
  }

  async detectCircularDependency(blameId, newBlockingTeamId, originTeamId) {
    const deps = await prisma.dependency.findMany({
      where: { blameId },
      select: { blockedTeamId: true, blockedByTeamId: true },
    });

    // Build adjacency: blockedBy -> blocked (reverse direction to trace the chain)
    const graph = new Map();
    deps.forEach((d) => {
      if (!graph.has(d.blockedByTeamId)) graph.set(d.blockedByTeamId, []);
      graph.get(d.blockedByTeamId).push(d.blockedTeamId);
    });

    // Add the new edge
    if (!graph.has(newBlockingTeamId)) graph.set(newBlockingTeamId, []);
    graph.get(newBlockingTeamId).push(originTeamId);

    // DFS to detect cycle
    const visited = new Set();
    const stack = new Set();

    const hasCycle = (node) => {
      visited.add(node);
      stack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (stack.has(neighbor)) return true;
        if (!visited.has(neighbor) && hasCycle(neighbor)) return true;
      }

      stack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node) && hasCycle(node)) return true;
    }

    return false;
  }
}

module.exports = new DependencyService();
