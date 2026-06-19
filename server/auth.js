/* =====================================================================
   Authentication — bcrypt password checks + JWT access tokens.
   ===================================================================== */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db } = require("./db");

const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const EXPIRES = process.env.JWT_EXPIRES || "7d";

const ROLE_PAGES = {
  "super-admin": ["dashboard", "orders", "customers", "analytics", "products", "content", "appearance", "images", "users", "settings"],
  "admin": ["products", "appearance", "images", "content"],
};

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, SECRET, { expiresIn: EXPIRES });
}

function verifyCredentials(email, password) {
  const u = db.users.find((x) => x.email === (email || "").toLowerCase());
  if (!u) return null;
  if (!bcrypt.compareSync(password || "", u.password)) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

// Express middleware: require a valid token; attaches req.user
function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : (req.cookies && req.cookies.fv_token);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired — please sign in again" });
  }
}

// Express middleware factory: require the user's role to allow a given page/area
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have access to this area" });
    }
    next();
  };
}

module.exports = { sign, verifyCredentials, requireAuth, requireRole, ROLE_PAGES, SECRET, bcrypt };
