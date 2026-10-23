// Authentication middleware used by protected API routes.
// Reads the Bearer token sent in the HTTP Authorization header.
// Verifies the token signature and expiration using the private JWT secret.
// Adds the authenticated account ID to the request for later route handlers.const jwt = require('jsonwebtoken');
function protect(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please sign in to access your notes' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session is invalid or has expired. Please sign in again.' });
  }
}

module.exports = protect;
