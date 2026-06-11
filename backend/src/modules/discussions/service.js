const prisma = require('../../config/database');
const { NotFoundError } = require('../../utils/errors');
const { notifyTeam, notify } = require('../../utils/notifications');

class DiscussionService {
  async listMessages(blameId, { page = 1, limit = 50 }) {
    const blame = await prisma.blame.findUnique({ where: { id: blameId } });
    if (!blame) throw new NotFoundError('Blame');

    const [messages, total] = await Promise.all([
      prisma.blameMessage.findMany({
        where: { blameId },
        include: {
          author: { select: { id: true, name: true, team: { select: { id: true, name: true } } } },
          attachments: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.blameMessage.count({ where: { blameId } }),
    ]);

    return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createMessage(blameId, content, user, mentionedTeamIds = []) {
    const blame = await prisma.blame.findUnique({
      where: { id: blameId },
      select: { id: true, title: true, creatorId: true, creatorTeamId: true, blamedTeamId: true, status: true },
    });
    if (!blame) throw new NotFoundError('Blame');

    const message = await prisma.blameMessage.create({
      data: { blameId, content, authorId: user.id },
      include: {
        author: { select: { id: true, name: true, team: { select: { id: true, name: true } } } },
        attachments: true,
      },
    });

    // Auto-transition to IN_DISCUSSION if still OPEN
    if (blame.status === 'OPEN') {
      await prisma.blame.update({ where: { id: blameId }, data: { status: 'IN_DISCUSSION' } });
    }

    // Update blame's updatedAt
    await prisma.blame.update({ where: { id: blameId }, data: { updatedAt: new Date() } });

    // Notify relevant teams
    const teamsToNotify = new Set([blame.creatorTeamId, blame.blamedTeamId]);
    for (const teamId of teamsToNotify) {
      await notifyTeam({
        teamId,
        type: 'NEW_MESSAGE',
        title: 'New Discussion Message',
        message: `${user.name} commented on "${blame.title}"`,
        blameId,
        excludeUserId: user.id,
      });
    }

    // Notify mentioned teams
    if (mentionedTeamIds && mentionedTeamIds.length > 0) {
      for (const teamId of mentionedTeamIds) {
        await notifyTeam({
          teamId,
          type: 'MENTIONED',
          title: 'Your team was mentioned',
          message: `${user.name} mentioned your team in "${blame.title}"`,
          blameId,
          excludeUserId: user.id,
        });
      }
    }

    return message;
  }
}

module.exports = new DiscussionService();
