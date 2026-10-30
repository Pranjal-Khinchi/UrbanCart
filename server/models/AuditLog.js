const mongoose = require('mongoose');
const { getTeacherConnection } = require('../config/db');

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. CREATE_PRODUCT, USER_LOGIN
    collection: { type: String, required: true }, // e.g. "products"
    recordId: { type: String, default: null },
    userId: { type: String, default: null },
    role: { type: String, default: null },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * IMPORTANT: This model is intentionally NOT bound at module-load time.
 * The teacher connection may be unavailable (missing env var, network issue),
 * and audit logging must never crash the application. getAuditLogModel()
 * returns null if the teacher connection doesn't exist, and callers
 * (see services/auditService.js) treat that as "logging skipped".
 */
function getAuditLogModel() {
  const conn = getTeacherConnection();
  if (!conn) return null;
  // Reuse the compiled model if it already exists on this connection.
  return conn.models.AuditLog || conn.model('AuditLog', auditLogSchema);
}

module.exports = { getAuditLogModel };
