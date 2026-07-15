const prisma = require('../config/database');
const { sendEmailBackground } = require('./email');

/**
 * Checks for unresolved blames (status: OPEN, IN_DISCUSSION, BLOCKED)
 * that have not been closed or resolved for more than 2 days, and sends reminders.
 */
async function sendUnresolvedBlameReminders() {
  console.log('[REMINDER] Starting unresolved blame check...');
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const unresolvedBlames = await prisma.blame.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_DISCUSSION', 'BLOCKED']
        },
        createdAt: {
          lte: twoDaysAgo
        }
      },
      include: {
        creator: { select: { email: true, name: true } },
        creatorTeam: { select: { name: true } },
        blamedTeam: { select: { id: true, name: true } }
      }
    });

    console.log(`[REMINDER] Found ${unresolvedBlames.length} unresolved blames older than 2 days.`);

    for (const blame of unresolvedBlames) {
      // Find active blamed team members
      const blamedTeamMembers = await prisma.user.findMany({
        where: {
          teamId: blame.blamedTeamId,
          status: 'ACTIVE'
        },
        select: { email: true }
      });

      const recipientEmails = [
        ...blamedTeamMembers.map(m => m.email),
        blame.creator.email,
        'foundersteam@cartrends.net'
      ];

      // Deduplicate and filter out invalid/empty emails
      const uniqueRecipients = [...new Set(recipientEmails.filter(Boolean))];

      if (uniqueRecipients.length > 0) {
        console.log(`[REMINDER] Sending reminder for blame "${blame.title}" (ID: ${blame.id}) to: ${uniqueRecipients.join(', ')}`);
        
        const subject = `[Blame Game Reminder] Unresolved Blame: ${blame.title}`;
        const text = `Reminder: The blame "${blame.title}" raised by ${blame.creatorName} (${blame.creatorTeam.name}) against ${blame.blamedTeamName} has been open/unresolved for more than 2 days.\n\nStatus: ${blame.status}\nCreated At: ${new Date(blame.createdAt).toLocaleString()}\n\nPlease take appropriate actions to discuss, resolve, or close this blame.`;
        
        const html = `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e5f0; border-radius: 8px; background-color: #f8f9fc;">
          <h2 style="color: #d9534f; margin-top: 0; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">Blame Game Reminder</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #1a1d2e;">
            This is an automated reminder that the following blame has remained unresolved/open for more than 2 days:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6; width: 30%;">Blame Title:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;"><strong>${blame.title}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Raised By:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;">${blame.creatorName} (${blame.creatorTeam.name})</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Blamed Team:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;">${blame.blamedTeamName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Current Status:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;"><span style="background: #f0ad4e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold;">${blame.status}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e5f0; font-weight: bold; background: #eef1f6;">Created At:</td>
              <td style="padding: 8px; border: 1px solid #e2e5f0;">${new Date(blame.createdAt).toLocaleString()}</td>
            </tr>
          </table>
          <p style="font-size: 15px; line-height: 1.6; color: #1a1d2e;">
            Please log in to the workspace to discuss, resolve, or close this blame.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e5f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #8b90a5;">This is an automated notification from your team's Blame Game Workspace.</p>
        </div>`;

        sendEmailBackground({
          to: uniqueRecipients.join(', '),
          subject,
          text,
          html
        });
      }
    }
  } catch (error) {
    console.error('[REMINDER] Error in unresolved blame check:', error.message);
  }
}

/**
 * Initializes and starts the background scheduler for reminders.
 */
function startReminderScheduler() {
  // Run check on startup with a 10 second delay so it doesn't interfere with initialization
  setTimeout(() => {
    sendUnresolvedBlameReminders();
  }, 10000);

  // Run the check every 24 hours
  setInterval(() => {
    sendUnresolvedBlameReminders();
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  sendUnresolvedBlameReminders,
  startReminderScheduler
};
