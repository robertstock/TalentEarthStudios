// Placeholder auth middleware.
// Replace with JWT verification or session auth.
export function requireAuth(req, res, next) {
  // Example: read Authorization: Bearer <token>
  // For now, allow everything.
  return next();
}
