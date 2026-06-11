const prisma = require('../../config/database');

class AnalyticsService {
  async leaderboard() {
    const teams = await prisma.team.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });
    
    const teamStats = await Promise.all(
      teams.map(async (team) => {
        const blamesAgainst = await prisma.blame.count({ where: { blamedTeamId: team.id } });
        return { team, blamesAgainst };
      })
    );
    const topBlamedTeams = teamStats.sort((a, b) => b.blamesAgainst - a.blamesAgainst).slice(0, 5);

    const blamerGroups = await prisma.blame.groupBy({
      by: ['creatorId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topBlamers = await Promise.all(
      blamerGroups.map(async (group) => {
        const user = await prisma.user.findUnique({
          where: { id: group.creatorId },
          select: { id: true, name: true, team: { select: { name: true } } },
        });
        return {
          user,
          blamesRaised: group._count.id,
        };
      })
    );

    return {
      topBlamedTeams,
      topBlamers,
    };
  }

  async overview() {
    const [total, open, critical, resolved, closed, blocked, inDiscussion] = await Promise.all([
      prisma.blame.count(),
      prisma.blame.count({ where: { status: 'OPEN' } }),
      prisma.blame.count({ where: { priority: 'CRITICAL' } }),
      prisma.blame.count({ where: { status: 'RESOLVED' } }),
      prisma.blame.count({ where: { status: 'CLOSED' } }),
      prisma.blame.count({ where: { status: 'BLOCKED' } }),
      prisma.blame.count({ where: { status: 'IN_DISCUSSION' } }),
    ]);

    // Average resolution time (for resolved/closed blames)
    const resolvedBlames = await prisma.blame.findMany({
      where: { status: { in: ['RESOLVED', 'CLOSED'] } },
      select: { createdAt: true, updatedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedBlames.length > 0) {
      const totalHours = resolvedBlames.reduce((sum, b) => {
        return sum + (b.updatedAt.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedBlames.length) * 10) / 10;
    }

    return {
      total,
      open,
      critical,
      resolved,
      closed,
      blocked,
      inDiscussion,
      avgResolutionHours,
    };
  }

  async teams() {
    const teams = await prisma.team.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    const teamStats = await Promise.all(
      teams.map(async (team) => {
        const [blamesAgainst, blamesRaised, openBlames, resolvedBlames, dependenciesInvolved] =
          await Promise.all([
            prisma.blame.count({ where: { blamedTeamId: team.id } }),
            prisma.blame.count({ where: { creatorTeamId: team.id } }),
            prisma.blame.count({ where: { blamedTeamId: team.id, status: { in: ['OPEN', 'IN_DISCUSSION', 'BLOCKED'] } } }),
            prisma.blame.count({ where: { blamedTeamId: team.id, status: { in: ['RESOLVED', 'CLOSED'] } } }),
            prisma.dependency.count({
              where: { OR: [{ blockedTeamId: team.id }, { blockedByTeamId: team.id }] },
            }),
          ]);

        // Avg resolution time for this team
        const resolved = await prisma.blame.findMany({
          where: { blamedTeamId: team.id, status: { in: ['RESOLVED', 'CLOSED'] } },
          select: { createdAt: true, updatedAt: true },
        });

        let avgResolutionHours = 0;
        if (resolved.length > 0) {
          const totalHours = resolved.reduce((sum, b) => {
            return sum + (b.updatedAt.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60);
          }, 0);
          avgResolutionHours = Math.round((totalHours / resolved.length) * 10) / 10;
        }

        return {
          team,
          blamesAgainst,
          blamesRaised,
          openBlames,
          resolvedBlames,
          avgResolutionHours,
          dependenciesInvolved,
        };
      })
    );

    return teamStats.sort((a, b) => b.blamesAgainst - a.blamesAgainst);
  }

  async categories() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const [total, open, resolved] = await Promise.all([
          prisma.blame.count({ where: { categoryId: cat.id } }),
          prisma.blame.count({ where: { categoryId: cat.id, status: { in: ['OPEN', 'IN_DISCUSSION', 'BLOCKED'] } } }),
          prisma.blame.count({ where: { categoryId: cat.id, status: { in: ['RESOLVED', 'CLOSED'] } } }),
        ]);

        return { category: cat, total, open, resolved };
      })
    );

    return categoryStats.sort((a, b) => b.total - a.total);
  }

  async productivity() {
    const blamesWithImpact = await prisma.blame.findMany({
      where: { estimatedHoursLost: { not: null } },
      select: {
        estimatedHoursLost: true,
        employeesAffected: true,
        businessImpactNotes: true,
        category: { select: { id: true, name: true } },
        blamedTeam: { select: { id: true, name: true } },
        creatorTeam: { select: { id: true, name: true } },
      },
    });

    const totalHoursLost = blamesWithImpact.reduce((sum, b) => sum + (b.estimatedHoursLost || 0), 0);
    const totalEmployeesAffected = blamesWithImpact.reduce((sum, b) => sum + (b.employeesAffected || 0), 0);

    // Group by category
    const byCategoryMap = {};
    blamesWithImpact.forEach((b) => {
      const key = b.category.id;
      if (!byCategoryMap[key]) {
        byCategoryMap[key] = { category: b.category, hoursLost: 0, count: 0 };
      }
      byCategoryMap[key].hoursLost += b.estimatedHoursLost || 0;
      byCategoryMap[key].count++;
    });

    // Group by blamed team
    const byTeamMap = {};
    blamesWithImpact.forEach((b) => {
      const key = b.blamedTeam.id;
      if (!byTeamMap[key]) {
        byTeamMap[key] = { team: b.blamedTeam, hoursLost: 0, count: 0 };
      }
      byTeamMap[key].hoursLost += b.estimatedHoursLost || 0;
      byTeamMap[key].count++;
    });

    return {
      totalHoursLost: Math.round(totalHoursLost * 10) / 10,
      totalEmployeesAffected,
      blamesWithImpactCount: blamesWithImpact.length,
      byCategory: Object.values(byCategoryMap).sort((a, b) => b.hoursLost - a.hoursLost),
      byTeam: Object.values(byTeamMap).sort((a, b) => b.hoursLost - a.hoursLost),
    };
  }

  async trends({ months = 6 } = {}) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const blames = await prisma.blame.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, priority: true },
    });

    // Group by month
    const monthlyData = {};
    blames.forEach((b) => {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, total: 0, critical: 0, resolved: 0 };
      }
      monthlyData[key].total++;
      if (b.priority === 'CRITICAL') monthlyData[key].critical++;
      if (b.status === 'RESOLVED' || b.status === 'CLOSED') monthlyData[key].resolved++;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }
}

module.exports = new AnalyticsService();
