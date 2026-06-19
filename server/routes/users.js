const router = require("express").Router();
const { db } = require("../db");
const { requireAuth, requireRole, bcrypt } = require("../auth");

// Only super-admins manage the team.
router.use(requireAuth, requireRole("super-admin"));

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at });
const isEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || "");
const VALID_ROLES = ["super-admin", "admin"];

// GET /api/users
router.get("/", (req, res) => res.json(db.users.all().map(publicUser)));

// POST /api/users  { name, email, password, role }
router.post("/", (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !isEmail(email) || !password || password.length < 8)
    return res.status(400).json({ error: "Name, a valid email and an 8+ char password are required" });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: "Invalid role" });
  if (db.users.find((u) => u.email === email.toLowerCase()))
    return res.status(409).json({ error: "A user with that email already exists" });
  const user = db.users.insert({ id: db.users.nextId(), name, email: email.toLowerCase(),
    password: bcrypt.hashSync(password, 12), role, created_at: new Date().toISOString() });
  res.status(201).json(publicUser(user));
});

// PATCH /api/users/:id  { name?, password?, role? }
router.patch("/:id", (req, res) => {
  const u = db.users.find((x) => String(x.id) === String(req.params.id));
  if (!u) return res.status(404).json({ error: "User not found" });
  const { name, password, role } = req.body || {};
  if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: "Invalid role" });
  if (password && password.length < 8) return res.status(400).json({ error: "Password must be 8+ characters" });
  db.users.update((x) => x.id === u.id, {
    name: name || u.name, role: role || u.role,
    password: password ? bcrypt.hashSync(password, 12) : u.password,
  });
  res.json(publicUser(db.users.find((x) => x.id === u.id)));
});

// DELETE /api/users/:id  (can't delete yourself)
router.delete("/:id", (req, res) => {
  if (String(req.user.id) === String(req.params.id)) return res.status(400).json({ error: "You can't remove your own account" });
  db.users.remove((x) => String(x.id) === String(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
