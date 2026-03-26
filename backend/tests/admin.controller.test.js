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

function loadController({ usuariosModelMock, bcryptMock }) {
  const usuariosModelPath = path.resolve(__dirname, "../models/usuarios.model.js");
  const bcryptPath = path.resolve(__dirname, "../node_modules/bcrypt/bcrypt.js");
  const controllerPath = path.resolve(__dirname, "../controllers/admin.controller.js");

  delete require.cache[usuariosModelPath];
  delete require.cache[bcryptPath];
  delete require.cache[controllerPath];

  require.cache[usuariosModelPath] = {
    id: usuariosModelPath,
    filename: usuariosModelPath,
    loaded: true,
    exports: usuariosModelMock,
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
    });

    const req = {
      user: { id: 2, username: "admin", role: "ADMIN" },
      body: { username: "guardia1", password: "Segura123!", role: "staff" },
    };
    const res = createRes();
    await crearUsuario(req, res, () => {});

    assert.equal(res.statusCode, 201);
    assert.equal(payload.role, "GUARDA");
    assert.equal(payload.passwordHash, "hash-123");
    assert.equal(payload.actorUserId, 2);
    assert.equal(res.body.usuario.role, "GUARDA");
  });

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }

  console.log("All tests passed");
})();
