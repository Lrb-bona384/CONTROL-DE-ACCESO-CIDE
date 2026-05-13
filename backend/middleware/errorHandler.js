function errorHandler(err, req, res, _next) {
  const context = {
    method: req.method,
    path: req.originalUrl,
    message: err && err.message ? err.message : "Error desconocido",
  };

  console.error("[error]", context);

  if (res.headersSent) {
    return;
  }

  if (err && err.expose) {
    return res.status(err.statusCode || 400).json({
      error: err.message || "No fue posible completar la operación.",
    });
  }

  return res.status(500).json({
    error: "Error interno del servidor",
  });
}

module.exports = { errorHandler };
