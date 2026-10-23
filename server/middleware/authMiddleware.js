// Verifies a Bearer JWT and makes its trusted user ID available to protected routes.
const jwt = require('jsonwebtoken');

// Reject unauthenticated requests; continue only when the token is valid.
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
