const prisma = require('../config/database');

/**
 * Create an immutable audit log entry
 */
async function createAuditLog({
  action,
  userId,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main operation
    console.error('[AUDIT] Failed to create audit log:', error.message);
  }
}

module.exports = { createAuditLog };
