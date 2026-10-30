const jwt = require('jsonwebtoken');

function generateToken(userId, role) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = generateToken;
