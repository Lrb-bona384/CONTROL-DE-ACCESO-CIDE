function ok(res, data) {
  return res.status(200).json(data);
}

function created(res, data) {
  return res.status(201).json(data);
}

function badRequest(res, msg) {
  return res.status(400).json({ error: msg || "Solicitud inválida" });
}

function unauthorized(res, msg) {
  return res.status(401).json({ error: msg || "No autorizado" });
}

function forbidden(res, msg) {
  return res.status(403).json({ error: msg || "Acceso prohibido" });
}

function serverError(res, msg) {
  return res.status(500).json({ error: msg || "Error interno del servidor" });
}

module.exports = {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
};
