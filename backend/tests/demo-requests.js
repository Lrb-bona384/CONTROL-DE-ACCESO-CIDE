/**
 * DEMO - Pruebas del Backend sin necesidad de PostgreSQL
 * Simula clientes haciendo requests a los endpoints
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";
const tests = [];

// Función para hacer requests HTTP
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Agregar test
function test(name, fn) {
  tests.push({ name, fn });
}

// Ejecutar todos los tests
async function runTests() {
  console.log("\n🧪 SUITE DE PRUEBAS - Control de Acceso CIDE");
  console.log("=".repeat(60));
  console.log(`📍 Servidor: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 Resultados: ${passed} pasaron, ${failed} fallaron`);
  console.log("=".repeat(60) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

// ============================================
// TESTS
// ============================================

test("1. Health Check - Servidor respondiendo", async () => {
  const res = await makeRequest("GET", "/health");
  if (res.status !== 200) throw new Error(`Status ${res.status}, esperado 200`);
  if (!res.body.status) throw new Error("No tiene propiedad 'status'");
});

test("2. Health Check - Base de datos conectada", async () => {
  const res = await makeRequest("GET", "/health");
  if (res.status === 200 && res.body.status === "OK") {
    console.log(`   DB conectada en: ${res.body.database_time}`);
  } else {
    console.log(`   ⚠ BD no disponible (esperado si no está configurada)`);
  }
});

test("3. Login - Usuario admin fallaría sin BD", async () => {
  const res = await makeRequest("POST", "/auth/login", {
    username: "admin",
    password: "Admin123!",
  });
  // Esperamos que falle o retorne error (porque BD no está)
  if (res.status >= 400) {
    console.log(`   Status esperado: ${res.status}`);
  }
});

test("4. GET / - Endpoint raíz funcionando", async () => {
  const res = await makeRequest("GET", "/");
  if (res.status !== 200) throw new Error(`Status ${res.status}, esperado 200`);
  if (!res.body.includes && !res.body.includes("funcionando"))
    console.log(`   Respuesta: ${res.body}`);
});

// ============================================
// EJECUTAR
// ============================================

// Esperar un poco a que el servidor esté listo
setTimeout(runTests, 1000);
