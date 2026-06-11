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

  async createMessage(blameId, content, user) {
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

    // Check for @mentions in content
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    if (mentions) {
      const mentionedNames = mentions.map((m) => m.slice(1));
      const mentionedUsers = await prisma.user.findMany({
        where: { name: { in: mentionedNames, mode: 'insensitive' }, status: 'ACTIVE' },
        select: { id: true },
      });
      if (mentionedUsers.length > 0) {
        await notify({
          type: 'MENTIONED',
          title: 'You were mentioned',
          message: `${user.name} mentioned you in "${blame.title}"`,
          blameId,
          userIds: mentionedUsers.map((u) => u.id),
          excludeUserId: user.id,
        });
      }
    }

    return message;
  }
}

module.exports = new DiscussionService();
