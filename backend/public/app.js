const output = document.getElementById("output");
const sessionRole = document.getElementById("session-role");
const sessionToken = document.getElementById("session-token");
const historyPanel = document.getElementById("history-panel");
const historyTable = document.getElementById("history-table");
const historyBody = document.getElementById("history-body");
const historyEmpty = document.getElementById("history-empty");
const historyButton = document.getElementById("history-btn");
const historyRefreshButton = document.getElementById("history-refresh-btn");
const historyDownloadButton = document.getElementById("history-download-btn");
const usersPanel = document.getElementById("users-panel");
const usersTable = document.getElementById("users-table");
const usersBody = document.getElementById("users-body");
const usersEmpty = document.getElementById("users-empty");
const studentsPanel = document.getElementById("students-panel");
const studentsTable = document.getElementById("students-table");
const studentsBody = document.getElementById("students-body");
const studentsEmpty = document.getElementById("students-empty");

let authToken = localStorage.getItem("access_token") || "";
let currentUser = JSON.parse(localStorage.getItem("auth_user") || "null");
let historyAutoRefreshId = null;
let currentAuditRows = [];
let currentUserRows = [];
let currentStudentRows = [];

function refreshSessionUI() {
  sessionRole.textContent = currentUser ? `${currentUser.username} / ${currentUser.role}` : "Sin iniciar";
  sessionToken.textContent = authToken ? "Disponible" : "No disponible";
  historyButton.classList.toggle("hidden", currentUser?.role !== "ADMIN");
}

function printResult(title, payload, isError = false) {
  output.classList.toggle("error", isError);
  output.textContent = `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}

function formatDateTime(value) {
  if (!value) {
    return { fecha: "-", hora: "-" };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { fecha: value, hora: "-" };
  }

  return {
    fecha: date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    hora: date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function hideHistoryPanel() {
  historyPanel.classList.add("hidden");
  stopHistoryAutoRefresh();
}

function hideUsersPanel() {
  usersPanel.classList.add("hidden");
}

function hideStudentsPanel() {
  studentsPanel.classList.add("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeCsv(value) {
  const normalized = String(value ?? "").replaceAll('"', '""');
  return `"${normalized}"`;
}

function updateHistoryActions() {
  const isAdmin = currentUser?.role === "ADMIN";
  historyDownloadButton.classList.toggle("hidden", !isAdmin);
  historyDownloadButton.disabled = !currentAuditRows.length;
}

function formatDateLabel(value) {
  const { fecha, hora } = formatDateTime(value);
  return fecha === "-" ? "-" : `${fecha} ${hora}`;
}

function renderEmptyTableState({ panel, table, empty, hasRows }) {
  panel.classList.remove("hidden");
  table.classList.toggle("hidden", !hasRows);
  empty.classList.toggle("hidden", hasRows);
}

function isHistoryVisible() {
  return !historyPanel.classList.contains("hidden");
}

function stopHistoryAutoRefresh() {
  if (historyAutoRefreshId) {
    window.clearInterval(historyAutoRefreshId);
    historyAutoRefreshId = null;
  }
}

function startHistoryAutoRefresh() {
  stopHistoryAutoRefresh();

  historyAutoRefreshId = window.setInterval(async () => {
    if (!isHistoryVisible() || currentUser?.role !== "ADMIN") {
      stopHistoryAutoRefresh();
      return;
    }

    try {
      const data = await apiFetch("/admin/auditoria");
      renderHistory(data.auditoria || []);
    } catch (_) {
      // Si falla una recarga automatica no interrumpimos la pantalla.
    }
  }, 5000);
}

function renderHistory(registros = []) {
  currentAuditRows = registros;
  historyBody.innerHTML = "";
  updateHistoryActions();

  if (!registros.length) {
    renderEmptyTableState({
      panel: historyPanel,
      table: historyTable,
      empty: historyEmpty,
      hasRows: false,
    });
    return;
  }

  const rows = registros.map((registro) => {
    const { fecha, hora } = formatDateTime(registro.created_at);
    const tipo = String(registro.tipo_movimiento || "").toUpperCase();
    const tipoClass = tipo.includes("ENTRADA") ? "entrada" : tipo.includes("SALIDA") ? "salida" : "";
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${hora}</td>
      <td><span class="history-type ${tipoClass}">${escapeHtml(tipo || "-")}</span></td>
      <td>${escapeHtml(registro.tabla || "-")}</td>
      <td>${escapeHtml(registro.registro_id ?? "-")}</td>
      <td>${escapeHtml(registro.actor_username || "Sistema")}</td>
      <td>${escapeHtml(registro.actor_role || "-")}</td>
      <td>${escapeHtml(registro.descripcion || "-")}</td>
    `;

    return tr;
  });

  historyBody.append(...rows);
  renderEmptyTableState({
    panel: historyPanel,
    table: historyTable,
    empty: historyEmpty,
    hasRows: true,
  });
  startHistoryAutoRefresh();
}

function renderUsers(rows = []) {
  currentUserRows = rows;
  usersBody.innerHTML = "";

  if (!rows.length) {
    renderEmptyTableState({
      panel: usersPanel,
      table: usersTable,
      empty: usersEmpty,
      hasRows: false,
    });
    return;
  }

  const fragment = document.createDocumentFragment();

  rows.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(user.id ?? "-")}</td>
      <td>${escapeHtml(user.username || "-")}</td>
      <td><span class="role-pill">${escapeHtml(user.role || "-")}</span></td>
      <td>${escapeHtml(formatDateLabel(user.created_at))}</td>
      <td>${escapeHtml(formatDateLabel(user.updated_at))}</td>
      <td>${escapeHtml(user.created_by ?? "-")}</td>
      <td>${escapeHtml(user.updated_by ?? "-")}</td>
    `;
    fragment.appendChild(tr);
  });

  usersBody.appendChild(fragment);
  renderEmptyTableState({
    panel: usersPanel,
    table: usersTable,
    empty: usersEmpty,
    hasRows: true,
  });
}

function renderStudents(rows = []) {
  currentStudentRows = rows;
  studentsBody.innerHTML = "";

  if (!rows.length) {
    renderEmptyTableState({
      panel: studentsPanel,
      table: studentsTable,
      empty: studentsEmpty,
      hasRows: false,
    });
    return;
  }

  const fragment = document.createDocumentFragment();

  rows.forEach((student) => {
    const tr = document.createElement("tr");
    const vigencia = student.vigencia ? "Vigente" : "No vigente";
    const vigenciaClass = student.vigencia ? "active" : "inactive";
    tr.innerHTML = `
      <td>${escapeHtml(student.documento || "-")}</td>
      <td>${escapeHtml(student.nombre || "-")}</td>
      <td>${escapeHtml(student.carrera || "-")}</td>
      <td>${escapeHtml(student.qr_uid || "-")}</td>
      <td><span class="status-pill ${vigenciaClass}">${escapeHtml(vigencia)}</span></td>
      <td>${escapeHtml(student.placa || "-")}</td>
      <td>${escapeHtml(student.color || "-")}</td>
      <td>${escapeHtml(formatDateLabel(student.created_at))}</td>
      <td>${escapeHtml(formatDateLabel(student.updated_at))}</td>
    `;
    fragment.appendChild(tr);
  });

  studentsBody.appendChild(fragment);
  renderEmptyTableState({
    panel: studentsPanel,
    table: studentsTable,
    empty: studentsEmpty,
    hasRows: true,
  });
}

function requireAuth(actionLabel) {
  if (authToken) return true;

  printResult(
    "Sesion requerida",
    {
      error: `Debes iniciar sesion antes de ${actionLabel}.`,
      hint: "Usa admin / Admin123! o guarda / Guarda123! en el bloque Login.",
    },
    true
  );

  return false;
}

async function apiFetch(url, options = {}) {
  const method = options.method || "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    cache: options.cache || "no-store",
    headers,
  });

  const text = await response.text();
  let data;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      data = { message: text, parseError: parseError.message };
    }
  } else {
    data = {};
  }

  console.log(`[api] ${method} ${url} -> ${response.status} ${response.statusText}`, data);

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
}

function downloadAuditCsv() {
  if (!currentAuditRows.length) {
    printResult("Sin datos para descargar", { error: "No hay registros de auditoria cargados." }, true);
    return;
  }

  const header = ["fecha", "hora", "tipo_movimiento", "tabla", "registro_id", "usuario", "rol", "descripcion"];
  const lines = currentAuditRows.map((registro) => {
    const { fecha, hora } = formatDateTime(registro.created_at);
    return [
      fecha,
      hora,
      registro.tipo_movimiento || "",
      registro.tabla || "",
      registro.registro_id ?? "",
      registro.actor_username || "Sistema",
      registro.actor_role || "",
      registro.descripcion || "",
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

  link.href = url;
  link.download = `auditoria-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  printResult("Auditoria descargada", {
    ok: true,
    archivo: `auditoria-${stamp}.csv`,
    registros: currentAuditRows.length,
  });
}

async function loadHistory() {
  if (!requireAuth("consultar el historico de auditoria")) return;
  if (currentUser?.role !== "ADMIN") {
    hideHistoryPanel();
    printResult("Acceso denegado", { error: "Solo ADMIN puede visualizar historicos." }, true);
    return;
  }

  try {
    const data = await apiFetch("/admin/auditoria");
    renderHistory(data.auditoria || []);
    printResult("Historico de auditoria", data);
  } catch (error) {
    hideHistoryPanel();
    printResult("Error consultando historicos", error, true);
  }
}

async function loadUsers() {
  if (!requireAuth("listar usuarios")) return;

  try {
    const data = await apiFetch("/admin/usuarios");
    renderUsers(data.usuarios || []);
    printResult("Usuarios del sistema", { count: data.count });
  } catch (error) {
    hideUsersPanel();
    printResult("Error listando usuarios", error, true);
  }
}

async function loadStudents() {
  if (!requireAuth("listar estudiantes")) return;

  try {
    const data = await apiFetch("/estudiantes");
    renderStudents(data.estudiantes || []);
    printResult("Listado de estudiantes", { count: data.count });
  } catch (error) {
    hideStudentsPanel();
    printResult("Error listando estudiantes", error, true);
  }
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("access_token", authToken);
    localStorage.setItem("auth_user", JSON.stringify(currentUser));
    refreshSessionUI();
    printResult("Login exitoso", data);
  } catch (error) {
    printResult("Error en login", error, true);
  }
});

document.getElementById("profile-btn").addEventListener("click", async () => {
  if (!requireAuth("consultar el perfil")) return;

  try {
    const data = await apiFetch("/auth/me");
    printResult("Perfil autenticado", data);
  } catch (error) {
    printResult("Error consultando perfil", error, true);
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  authToken = "";
  currentUser = null;
  localStorage.removeItem("access_token");
  localStorage.removeItem("auth_user");
  refreshSessionUI();
  hideHistoryPanel();
  printResult("Sesion cerrada", { ok: true });
});

document.getElementById("user-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireAuth("crear usuarios")) return;

  const formData = new FormData(event.currentTarget);

  try {
    const data = await apiFetch("/admin/usuarios", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    printResult("Usuario creado", data);
    event.currentTarget.reset();
  } catch (error) {
    printResult("Error creando usuario", error, true);
  }
});

document.getElementById("users-btn").addEventListener("click", async () => {
  await loadUsers();
});

document.getElementById("student-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireAuth("registrar estudiantes")) return;

  const formData = new FormData(event.currentTarget);

  try {
    const data = await apiFetch("/estudiantes/primer-ingreso", {
      method: "POST",
      body: JSON.stringify({
        documento: formData.get("documento"),
        qr_uid: formData.get("qr_uid"),
        nombre: formData.get("nombre"),
        carrera: formData.get("carrera"),
        placa: formData.get("placa"),
        color: formData.get("color"),
        vigencia: formData.get("vigencia") === "on",
      }),
    });

    printResult("Estudiante registrado", data);
    event.currentTarget.reset();
  } catch (error) {
    printResult("Error registrando estudiante", error, true);
  }
});

document.getElementById("document-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireAuth("consultar estudiantes")) return;

  const formData = new FormData(event.currentTarget);

  try {
    const data = await apiFetch(`/estudiantes/documento/${encodeURIComponent(formData.get("documento"))}`);
    printResult("Estudiante encontrado", data);
  } catch (error) {
    printResult("Error consultando estudiante", error, true);
  }
});

document.getElementById("movement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireAuth("registrar movimientos")) return;

  const formData = new FormData(event.currentTarget);

  try {
    const data = await apiFetch("/movimientos/registrar", {
      method: "POST",
      body: JSON.stringify({
        qr_uid: formData.get("qr_input"),
      }),
    });
    printResult("Movimiento registrado", data);

    if (currentUser?.role === "ADMIN" && isHistoryVisible()) {
      await loadHistory();
    }
  } catch (error) {
    printResult("Error registrando movimiento", error, true);
  }
});

document.getElementById("inside-btn").addEventListener("click", async () => {
  if (!requireAuth("consultar estudiantes dentro del campus")) return;

  try {
    const data = await apiFetch("/movimientos/dentro-campus");
    printResult("Estudiantes dentro del campus", data);
  } catch (error) {
    printResult("Error consultando dentro del campus", error, true);
  }
});

document.getElementById("history-btn").addEventListener("click", async () => {
  await loadHistory();
});

document.getElementById("students-btn").addEventListener("click", async () => {
  await loadStudents();
});

document.getElementById("clear-output").addEventListener("click", () => {
  printResult("Respuesta", { ok: true, message: "Salida limpia" });
});

document.getElementById("history-close-btn").addEventListener("click", () => {
  hideHistoryPanel();
});

historyRefreshButton.addEventListener("click", async () => {
  await loadHistory();
});

historyDownloadButton.addEventListener("click", () => {
  downloadAuditCsv();
});

document.getElementById("users-refresh-btn").addEventListener("click", async () => {
  await loadUsers();
});

document.getElementById("users-close-btn").addEventListener("click", () => {
  hideUsersPanel();
});

document.getElementById("students-refresh-btn").addEventListener("click", async () => {
  await loadStudents();
});

document.getElementById("students-close-btn").addEventListener("click", () => {
  hideStudentsPanel();
});

refreshSessionUI();
updateHistoryActions();
hideHistoryPanel();
hideUsersPanel();
hideStudentsPanel();
