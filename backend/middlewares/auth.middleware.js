const jwt = require("jsonwebtoken");
const { unauthorized, serverError } = require("../utils/response");

function resolveJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev_secret";
  }

  return null;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res, "Token requerido");
  }

  const token = authHeader.slice(7);
  const jwtSecret = resolveJwtSecret();

  if (!jwtSecret) {
    return serverError(res, "JWT_SECRET no configurado");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return unauthorized(res, "Token inválido o expirado");
  }
}

module.exports = authMiddleware;
