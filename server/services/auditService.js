const { getAuditLogModel } = require('../models/AuditLog');

// Keys that must never be persisted to the audit log, even accidentally
// via a spread metadata object.
const FORBIDDEN_KEYS = ['password', 'passwordHash', 'token', 'jwt', 'secret', 'mongoUri', 'connectionString'];

function sanitizeMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') return {};
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Write one audit log entry to the TEACHER database.
 * This function NEVER throws — a failure here must not break the
 * primary e-commerce operation that triggered it. Failures are only
 * logged to the server console.
 */
async function logActivity({ action, collection, recordId = null, userId = null, role = null, description, metadata = {} }) {
  try {
    const AuditLog = getAuditLogModel();
    if (!AuditLog) {
      console.warn(`[Audit] Skipped "${action}" — teacher database is not connected.`);
      return;
    }

    await AuditLog.create({
      action,
      collection,
      recordId: recordId ? String(recordId) : null,
      userId: userId ? String(userId) : null,
      role,
      description,
      metadata: sanitizeMetadata(metadata),
      timestamp: new Date(),
    });
  } catch (err) {
    // Deliberately swallow — the teacher DB is never a single point of failure.
    console.error(`[Audit] Failed to log activity "${action}":`, err.message);
  }
}

module.exports = { logActivity };
