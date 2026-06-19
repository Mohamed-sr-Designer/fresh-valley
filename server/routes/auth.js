const router = require("express").Router();
const { sign, verifyCredentials, requireAuth } = require("../auth");

// POST /api/auth/login  { email, password }  → { token, user }
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const user = verifyCredentials(email, password);
  if (!user) return res.status(401).json({ error: "Those credentials don't match a team member" });
  res.json({ token: sign(user), user });
});

// GET /api/auth/me  → current signed-in user
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

module.exports = router;
