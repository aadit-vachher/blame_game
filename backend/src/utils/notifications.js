const prisma = require('../config/database');

/**
 * Create notifications for relevant users
 */
async function notify({ type, title, message, blameId = null, userIds = [], excludeUserId = null }) {
  try {
    const targetUserIds = userIds.filter((id) => id !== excludeUserId);
    if (targetUserIds.length === 0) return;

    await prisma.notification.createMany({
      data: targetUserIds.map((userId) => ({
        type,
        title,
        message,
        userId,
        blameId,
      })),
    });
  } catch (error) {
    console.error('[NOTIFICATION] Failed to create notifications:', error.message);
  }
}

/**
 * Notify all members of a team
 */
async function notifyTeam({ teamId, type, title, message, blameId = null, excludeUserId = null }) {
  try {
    const members = await prisma.user.findMany({
      where: { teamId, status: 'ACTIVE' },
      select: { id: true },
    });

    await notify({
      type,
      title,
      message,
      blameId,
      userIds: members.map((m) => m.id),
      excludeUserId,
    });
  } catch (error) {
    console.error('[NOTIFICATION] Failed to notify team:', error.message);
  }
}

module.exports = { notify, notifyTeam };
