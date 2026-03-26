const output = document.getElementById("output");
const sessionRole = document.getElementById("session-role");
const sessionToken = document.getElementById("session-token");

let authToken = localStorage.getItem("access_token") || "";
let currentUser = JSON.parse(localStorage.getItem("auth_user") || "null");
const userForm = document.getElementById("user-form");
const studentForm = document.getElementById("student-form");

function refreshSessionUI() {
  sessionRole.textContent = currentUser ? `${currentUser.username} / ${currentUser.role}` : "Sin iniciar";
  sessionToken.textContent = authToken ? "Disponible" : "No disponible";
}

function normalizeErrorPayload(error) {
  if (!error) {
    return { error: "Ocurrio un error desconocido" };
  }

  if (error.data && typeof error.data === "object") {
    return error.status ? { status: error.status, ...error.data } : error.data;
  }

  if (error.data) {
    return error.status ? { status: error.status, error: error.data } : { error: error.data };
  }

  if (error instanceof Error) {
    return { error: error.message };
  }

  if (typeof error === "string") {
    return { error };
  }

  return error;
}

function printResult(title, payload, isError = false) {
  output.classList.toggle("error", isError);
  const finalPayload = isError ? normalizeErrorPayload(payload) : payload;
  output.textContent = `${title}\n\n${JSON.stringify(finalPayload, null, 2)}`;
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

function normalizePlate(value) {
  return value.trim().toUpperCase();
}

function parsePositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function ensureAdmin(actionLabel) {
  if (!requireAuth(actionLabel)) return false;

  if (currentUser && currentUser.role === "ADMIN") return true;

  printResult(
    "Permiso insuficiente",
    { error: `Solo ADMIN puede ${actionLabel}.` },
    true
  );
  return false;
}

function buildUserPayload(formData, { requireAllFields = false } = {}) {
  const username = (formData.get("username") || "").trim();
  const password = formData.get("password") || "";
  const role = formData.get("role");
  const payload = {};

  if (requireAllFields || username) payload.username = username;
  if (requireAllFields || password) payload.password = password;
  if (requireAllFields || role) payload.role = role;

  return payload;
}

function buildStudentPayload(formData) {
  return {
    documento: (formData.get("documento") || "").trim(),
    qr_uid: (formData.get("qr_uid") || "").trim(),
    nombre: (formData.get("nombre") || "").trim(),
    carrera: (formData.get("carrera") || "").trim(),
    placa: normalizePlate(formData.get("placa") || ""),
    color: (formData.get("color") || "").trim(),
    vigencia: formData.get("vigencia") === "on",
  };
}

async function apiFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { error: text };
    }
  }

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
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
  printResult("Sesion cerrada", { ok: true });
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ensureAdmin("crear usuarios")) return;

  const form = event.currentTarget;
  const formData = new FormData(form);

  try {
    const data = await apiFetch("/admin/usuarios", {
      method: "POST",
      body: JSON.stringify(buildUserPayload(formData, { requireAllFields: true })),
    });

    printResult("Usuario creado", data);
    form.reset();
  } catch (error) {
    printResult("Error creando usuario", error, true);
  }
});

document.getElementById("users-btn").addEventListener("click", async () => {
  if (!ensureAdmin("listar usuarios")) return;

  try {
    const data = await apiFetch("/admin/usuarios");
    printResult("Usuarios del sistema", data);
  } catch (error) {
    printResult("Error listando usuarios", error, true);
  }
});

document.getElementById("update-user-btn").addEventListener("click", async () => {
  if (!ensureAdmin("editar usuarios")) return;

  const formData = new FormData(userForm);
  const id = parsePositiveInt(formData.get("id"));

  if (!id) {
    printResult("Error editando usuario", { error: "Debes indicar un ID de usuario valido" }, true);
    return;
  }

  try {
    const data = await apiFetch(`/admin/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(buildUserPayload(formData)),
    });

    printResult("Usuario actualizado", data);
  } catch (error) {
    printResult("Error editando usuario", error, true);
  }
});

document.getElementById("delete-user-btn").addEventListener("click", async () => {
  if (!ensureAdmin("eliminar usuarios")) return;

  const formData = new FormData(userForm);
  const id = parsePositiveInt(formData.get("id"));

  if (!id) {
    printResult("Error eliminando usuario", { error: "Debes indicar un ID de usuario valido" }, true);
    return;
  }

  try {
    const data = await apiFetch(`/admin/usuarios/${id}`, {
      method: "DELETE",
    });

    printResult("Usuario eliminado", data);
    userForm.reset();
  } catch (error) {
    printResult("Error eliminando usuario", error, true);
  }
});

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireAuth("registrar estudiantes")) return;

  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = buildStudentPayload(formData);

  if (!/^[A-Z]{3}\d{2}[A-Z]$/.test(payload.placa)) {
    printResult(
      "Error registrando estudiante",
      { error: "La placa debe tener formato ABC12D" },
      true
    );
    return;
  }

  try {
    const data = await apiFetch("/estudiantes/primer-ingreso", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    printResult("Estudiante registrado", data);
    form.reset();
  } catch (error) {
    printResult("Error registrando estudiante", error, true);
  }
});

document.getElementById("update-student-btn").addEventListener("click", async () => {
  if (!ensureAdmin("editar estudiantes")) return;

  const formData = new FormData(studentForm);
  const id = parsePositiveInt(formData.get("id"));
  const payload = buildStudentPayload(formData);

  if (!id) {
    printResult("Error editando estudiante", { error: "Debes indicar un ID de estudiante valido" }, true);
    return;
  }

  if (!/^[A-Z]{3}\d{2}[A-Z]$/.test(payload.placa)) {
    printResult("Error editando estudiante", { error: "La placa debe tener formato ABC12D" }, true);
    return;
  }

  try {
    const data = await apiFetch(`/admin/estudiantes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    printResult("Estudiante actualizado", data);
  } catch (error) {
    printResult("Error editando estudiante", error, true);
  }
});

document.getElementById("delete-student-btn").addEventListener("click", async () => {
  if (!ensureAdmin("eliminar estudiantes")) return;

  const formData = new FormData(studentForm);
  const id = parsePositiveInt(formData.get("id"));

  if (!id) {
    printResult("Error eliminando estudiante", { error: "Debes indicar un ID de estudiante valido" }, true);
    return;
  }

  try {
    const data = await apiFetch(`/admin/estudiantes/${id}`, {
      method: "DELETE",
    });

    printResult("Estudiante eliminado", data);
    studentForm.reset();
  } catch (error) {
    printResult("Error eliminando estudiante", error, true);
  }
});

document.querySelector('input[name="placa"]').addEventListener("input", (event) => {
  event.target.value = normalizePlate(event.target.value).slice(0, 6);
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

document.getElementById("students-btn").addEventListener("click", async () => {
  if (!requireAuth("listar estudiantes")) return;

  try {
    const data = await apiFetch("/estudiantes");
    printResult("Listado de estudiantes", data);
  } catch (error) {
    printResult("Error listando estudiantes", error, true);
  }
});

document.getElementById("clear-output").addEventListener("click", () => {
  printResult("Respuesta", { ok: true, message: "Salida limpia" });
});

refreshSessionUI();
