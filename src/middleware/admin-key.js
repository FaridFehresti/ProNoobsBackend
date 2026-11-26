function requireAdminKey(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return res.status(503).json({ error: 'Write API is not configured.' });
  }

  const provided = req.get('X-API-Key');
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'A valid X-API-Key is required.' });
  }

  next();
}

module.exports = { requireAdminKey };
