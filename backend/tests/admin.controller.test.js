const assert = require("node:assert/strict");
const path = require("node:path");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function loadController({ usuariosModelMock, bcryptMock, estudiantesModelMock, poolMock }) {
  const usuariosModelPath = path.resolve(__dirname, "../models/usuarios.model.js");
  const estudiantesModelPath = path.resolve(__dirname, "../models/estudiantes.model.js");
  const poolPath = path.resolve(__dirname, "../config/database.js");
  const bcryptPath = path.resolve(__dirname, "../node_modules/bcrypt/bcrypt.js");
  const controllerPath = path.resolve(__dirname, "../controllers/admin.controller.js");

  delete require.cache[usuariosModelPath];
  delete require.cache[estudiantesModelPath];
  delete require.cache[poolPath];
  delete require.cache[bcryptPath];
  delete require.cache[controllerPath];

  require.cache[usuariosModelPath] = {
    id: usuariosModelPath,
    filename: usuariosModelPath,
    loaded: true,
    exports: usuariosModelMock,
  };

  require.cache[estudiantesModelPath] = {
    id: estudiantesModelPath,
    filename: estudiantesModelPath,
    loaded: true,
    exports: estudiantesModelMock || {},
  };

  require.cache[poolPath] = {
    id: poolPath,
    filename: poolPath,
    loaded: true,
    exports: poolMock || {},
  };

  require.cache[bcryptPath] = {
    id: bcryptPath,
    filename: bcryptPath,
    loaded: true,
    exports: bcryptMock,
  };

  return require(controllerPath);
}

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

(async () => {
  await runTest("listarUsuarios retorna count y usuarios", async () => {
    const fakeRows = [{ id: 1, username: "admin", role: "ADMIN" }];
    const { listarUsuarios } = loadController({
      usuariosModelMock: {
        listUsuarios: async () => ({ rows: fakeRows }),
      },
      bcryptMock: {},
      estudiantesModelMock: {},
      poolMock: {},
    });

    const res = createRes();
    await listarUsuarios({}, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      count: 1,
      usuarios: fakeRows,
    });
  });

  await runTest("crearUsuario retorna 409 si username ya existe", async () => {
    const { crearUsuario } = loadController({
      usuariosModelMock: {
        findByUsername: async () => ({ rows: [{ id: 1, username: "admin" }] }),
      },
      bcryptMock: {
        hash: async () => "hash",
      },
      estudiantesModelMock: {},
      poolMock: {},
    });

    const req = { body: { username: "admin", password: "Admin123!", role: "ADMIN" } };
    const res = createRes();
    await crearUsuario(req, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { error: "El usuario ya existe" });
  });

  await runTest("crearUsuario crea usuario con role normalizado", async () => {
    let payload = null;
    const { crearUsuario } = loadController({
      usuariosModelMock: {
        findByUsername: async () => ({ rows: [] }),
        createUsuario: async (input) => {
          payload = input;
          return { rows: [{ id: 8, username: input.username, role: input.role }] };
        },
      },
      bcryptMock: {
        hash: async () => "hash-123",
      },
      estudiantesModelMock: {},
      poolMock: {},
    });

    const req = { body: { username: "guardia1", password: "Segura123!", role: "staff" } };
    const res = createRes();
    await crearUsuario(req, res, () => {});

    assert.equal(res.statusCode, 201);
    assert.equal(payload.role, "GUARDA");
    assert.equal(payload.passwordHash, "hash-123");
    assert.equal(res.body.usuario.role, "GUARDA");
  });

  await runTest("actualizarUsuario modifica role y password", async () => {
    let payload = null;
    const { actualizarUsuario } = loadController({
      usuariosModelMock: {
        findById: async () => ({ rows: [{ id: 7, username: "guardia1", role: "GUARDA" }] }),
        findByUsername: async () => ({ rows: [] }),
        updateUsuario: async (_id, input) => {
          payload = input;
          return { rows: [{ id: 7, username: "guardia1", role: "CONSULTA" }] };
        },
      },
      bcryptMock: {
        hash: async () => "hash-new",
      },
      estudiantesModelMock: {},
      poolMock: {},
    });

    const req = {
      params: { id: "7" },
      body: { role: "consulta", password: "Nueva123!" },
    };
    const res = createRes();

    await actualizarUsuario(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(payload.role, "CONSULTA");
    assert.equal(payload.passwordHash, "hash-new");
    assert.equal(res.body.usuario.role, "CONSULTA");
  });

  await runTest("eliminarUsuario retorna 404 si no existe", async () => {
    const { eliminarUsuario } = loadController({
      usuariosModelMock: {
        deleteUsuario: async () => ({ rows: [] }),
      },
      bcryptMock: {},
      estudiantesModelMock: {},
      poolMock: {},
    });

    const req = { params: { id: "99" } };
    const res = createRes();

    await eliminarUsuario(req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: "Usuario no encontrado" });
  });

  await runTest("actualizarEstudiante retorna 409 si qr_uid ya existe", async () => {
    const queries = [];
    const client = {
      query: async (sql) => {
        queries.push(sql);
        return { rows: [] };
      },
      release() {},
    };

    const duplicateError = new Error("duplicate key");
    duplicateError.code = "23505";
    duplicateError.constraint = "estudiantes_qr_uid_key";

    const { actualizarEstudiante } = loadController({
      usuariosModelMock: {},
      bcryptMock: {},
      estudiantesModelMock: {
        updateById: async () => {
          throw duplicateError;
        },
      },
      poolMock: {
        connect: async () => client,
      },
    });

    const req = {
      params: { id: "3" },
      body: {
        documento: "123456",
        qr_uid: "QR001",
        nombre: "Luis",
        carrera: "Ing",
        vigencia: true,
        placa: "ABC12D",
        color: "Negro",
      },
    };
    const res = createRes();

    await actualizarEstudiante(req, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, { error: "qr_uid ya esta registrado en otro estudiante" });
    assert.ok(queries.some((sql) => /BEGIN/.test(sql)), "Debe abrir transaccion");
    assert.ok(queries.some((sql) => /ROLLBACK/.test(sql)), "Debe revertir transaccion");
  });

  await runTest("eliminarEstudiante elimina cuando existe", async () => {
    const queries = [];
    const client = {
      query: async (sql) => {
        queries.push(sql);
        return { rows: [] };
      },
      release() {},
    };

    const { eliminarEstudiante } = loadController({
      usuariosModelMock: {},
      bcryptMock: {},
      estudiantesModelMock: {
        deleteById: async () => ({
          rows: [{ id: 5, documento: "123456", qr_uid: "QR001", nombre: "Luis", carrera: "Ing", vigencia: true }],
        }),
      },
      poolMock: {
        connect: async () => client,
      },
    });

    const req = { params: { id: "5" } };
    const res = createRes();

    await eliminarEstudiante(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, "Estudiante eliminado");
    assert.ok(queries.some((sql) => /BEGIN/.test(sql)), "Debe abrir transaccion");
    assert.ok(queries.some((sql) => /COMMIT/.test(sql)), "Debe confirmar transaccion");
  });

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }

  console.log("All tests passed");
})();
