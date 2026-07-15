const { sendUnresolvedBlameReminders } = require('../utils/reminderScheduler');
const prisma = require('../config/database');

async function run() {
  console.log('--- STARTING ONE-TIME UNRESOLVED BLAME REMINDER RUN ---');
  try {
    await sendUnresolvedBlameReminders();
    console.log('--- ONE-TIME REMINDER RUN FINISHED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Error during one-time reminder run:', error);
  } finally {
    // Disconnect prisma client to let the process exit
    await prisma.$disconnect();
  }
}

run();
