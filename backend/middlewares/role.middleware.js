const { unauthorized, forbidden } = require("../utils/response");

function requireRole(role) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return unauthorized(res, "No autenticado");
    }

    if (req.user.role !== role) {
      return forbidden(res, "No tienes permisos para esta acción");
    }

    return next();
  };
}

module.exports = requireRole;
