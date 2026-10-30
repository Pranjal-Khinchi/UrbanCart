/**
 * Two independent Mongoose connections:
 *  - primaryConnection -> MONGODB_URI_PRIMARY -> all real application data
 *  - teacherConnection -> MONGODB_URI_TEACHER -> AuditLog ONLY
 *
 * These are separate mongoose.createConnection() instances so that models
 * attached to one can never accidentally end up in the other database.
 */
const mongoose = require('mongoose');

let primaryConnection = null;
let teacherConnection = null;

function createPrimaryConnection() {
  const uri = process.env.MONGODB_URI_PRIMARY;
  if (!uri) {
    throw new Error(
      'MONGODB_URI_PRIMARY is not set. The primary application database is required to start the server. See .env.example.'
    );
  }

  primaryConnection = mongoose.createConnection(uri);

  primaryConnection.on('connected', () => {
    console.log('[DB] Primary (application) database connected');
  });
  primaryConnection.on('error', (err) => {
    console.error('[DB] Primary database connection error:', err.message);
  });
  primaryConnection.on('disconnected', () => {
    console.warn('[DB] Primary database disconnected');
  });

  return primaryConnection;
}

function createTeacherConnection() {
  const uri = process.env.MONGODB_URI_TEACHER;

  if (!uri) {
    console.warn(
      '[DB] MONGODB_URI_TEACHER is not set. Audit logging will be disabled, but the main application will continue to work.'
    );
    return null;
  }

  teacherConnection = mongoose.createConnection(uri);

  teacherConnection.on('connected', () => {
    console.log('[DB] Teacher (audit log) database connected');
  });
  teacherConnection.on('error', (err) => {
    // Non-fatal by design: the teacher DB must never take down the app.
    console.error('[DB] Teacher database connection error (audit logging disabled):', err.message);
  });
  teacherConnection.on('disconnected', () => {
    console.warn('[DB] Teacher database disconnected. Audit logging paused.');
  });

  return teacherConnection;
}

async function connectDatabases() {
  const primary = createPrimaryConnection();

  // Wait for primary — the app cannot run without it.
  await new Promise((resolve, reject) => {
    primary.once('open', resolve);
    primary.once('error', reject);
  });

  // Teacher DB connects "best effort" — failures here are logged but never thrown,
  // and never block the rest of the application from starting up.
  try {
    const teacher = createTeacherConnection();
    if (teacher) {
      teacher.on('error', () => {
        /* already logged above; swallow so it can't crash the process */
      });
    }
  } catch (err) {
    console.error('[DB] Failed to initialize teacher database connection:', err.message);
  }

  return primary;
}

function getPrimaryConnection() {
  if (!primaryConnection) {
    throw new Error('Primary database connection has not been initialized yet.');
  }
  return primaryConnection;
}

function getTeacherConnection() {
  // May be null if MONGODB_URI_TEACHER was not provided or failed — callers must handle that.
  return teacherConnection;
}

module.exports = {
  connectDatabases,
  getPrimaryConnection,
  getTeacherConnection,
};
