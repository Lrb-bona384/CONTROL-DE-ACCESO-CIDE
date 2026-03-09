const { ROLES } = require("../constants/roles");

function normalizeRole(value) {
  if (typeof value !== "string") return null;
  const role = value.trim().toUpperCase();
  return role || null;
}

function requireRole(allowedRolesInput) {
  const allowedRoles = Array.isArray(allowedRolesInput)
    ? allowedRolesInput.map(normalizeRole).filter(Boolean)
    : [normalizeRole(allowedRolesInput)].filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const role = normalizeRole(req.user.role);

    if (!role) {
      return res.status(403).json({ error: "Rol no informado en token" });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(403).json({ error: "Rol no valido", role });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "No autorizado para este recurso",
        role,
        allowed_roles: allowedRoles,
      });
    }

    req.userRole = role;
    return next();
  };
}

module.exports = { requireRole };
