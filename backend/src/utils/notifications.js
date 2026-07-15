const prisma = require('../config/database');
const { sendEmailBackground } = require('./email');

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
      select: { id: true, email: true },
    });

    await notify({
      type,
      title,
      message,
      blameId,
      userIds: members.map((m) => m.id),
      excludeUserId,
    });

    // Send background email notifications to all active members of the blamed team
    const recipientEmails = members
      .filter((m) => m.id !== excludeUserId)
      .map((m) => m.email);

    if (recipientEmails.length > 0) {
      sendEmailBackground({
        to: recipientEmails.join(', '),
        subject: `[Blame Game] ${title}`,
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e5f0; border-radius: 8px; background-color: #f8f9fc;">
          <h2 style="color: #4f5fe0; margin-top: 0; border-bottom: 2px solid #4f5fe0; padding-bottom: 10px;">${title}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #1a1d2e;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e2e5f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #8b90a5;">This is an automated notification from your team's Blame Game Workspace.</p>
        </div>`,
      });
    }

    // Notify foundersteam@cartrends.net of any activity
    let foundersSubject = `[Blame Game] ${title}`;
    let foundersText = message;
    let foundersHtml = `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e5f0; border-radius: 8px; background-color: #f8f9fc;">
          <h2 style="color: #4f5fe0; margin-top: 0; border-bottom: 2px solid #4f5fe0; padding-bottom: 10px;">${title}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #1a1d2e;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e2e5f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #8b90a5;">This is an automated notification from your team's Blame Game Workspace.</p>
        </div>`;

    if (type === 'BLAME_ASSIGNED' && blameId) {
      const blame = await prisma.blame.findUnique({
        where: { id: blameId },
        include: {
          creatorTeam: { select: { name: true } },
          blamedTeam: { select: { name: true } }
        }
      });
      if (blame) {
        const creatorTeamName = blame.creatorTeam?.name || 'Unknown Team';
        const blamedTeamName = blame.blamedTeam?.name || 'Unknown Team';
        
        foundersSubject = `[Blame Game] New Blame Raised: ${blame.title}`;
        foundersText = `${creatorTeamName} has blamed ${blamedTeamName} for the following purpose: "${blame.title}". Description: "${blame.description}". and your login credentials are login id- admin@blamegame.com pass-'admin123'`;
        foundersHtml = `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e5f0; border-radius: 8px; background-color: #f8f9fc;">
          <h2 style="color: #4f5fe0; margin-top: 0; border-bottom: 2px solid #4f5fe0; padding-bottom: 10px;">New Blame Created</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #1a1d2e;">
            ${creatorTeamName} has blamed ${blamedTeamName} for the following purpose and your login credentials are login id- admin@blamegame.com pass-'admin123'
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6; width: 30%;">Blaming Team:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;">${creatorTeamName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Blamed Team:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;">${blamedTeamName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Title:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;"><strong>${blame.title}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Description:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;">${blame.description}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2e5f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #8b90a5;">This is an automated notification from your team's Blame Game Workspace.</p>
        </div>`;
      }
    }

    sendEmailBackground({
      to: 'foundersteam@cartrends.net',
      subject: foundersSubject,
      text: foundersText,
      html: foundersHtml,
    });
  } catch (error) {
    console.error('[NOTIFICATION] Failed to notify team:', error.message);
  }
}

module.exports = { notify, notifyTeam };
