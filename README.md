# Sistema de Control de Acceso con QR

Backend academico para registrar entrada/salida de estudiantes mediante lectura de codigo QR.

## Tecnologias
- Node.js
- Express
- PostgreSQL (`pg`)
- bcrypt
- jsonwebtoken

## Estructura
```text
backend/
|- config/
|  `- database.js
|- controllers/
|  |- auth.controller.js
|  |- estudiantes.controller.js
|  `- movimientos.controller.js
|- models/
|  |- estudiantes.model.js
|  `- movimientos.model.js
|- middleware/
|  |- requireRole.js
|  `- errorHandler.js
|- routes/
|  |- auth.routes.js
|  |- estudiantes.routes.js
|  |- movimientos.routes.js
|  `- admin.routes.js
|- database/
|  `- schema.sql
`- server.js
```

## Configuracion
1. Clonar repositorio:
```bash
git clone https://github.com/IngAutomata/CONTROL-DE-ACCESO-CIDE.git
```

2. Entrar al backend:
```bash
cd CONTROL-DE-ACCESO-CIDE/backend
```

3. Instalar dependencias:
```bash
npm install
```

4. Crear archivo `.env`:
```powershell
Copy-Item .env.example .env
```

Variables requeridas:
- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `PORT` (opcional, por defecto `3000`)

## Base de datos
Crear DB:
```sql
CREATE DATABASE control_acceso_cide;
```

Ejecutar schema:
```bash
psql -U postgres -d control_acceso_cide -f database/schema.sql
```

Tablas principales:
- `estudiantes`
- `movimientos` (FK a `estudiantes.id`)
- `motocicletas`

## Ejecutar backend
```bash
npm start
```

Health:
- `GET http://localhost:3000/health`

## Autorizacion por rol
Rutas protegidas usan header `x-role` con valores:
- `ADMIN`
- `GUARDA`
- `CONSULTA`

Ejemplo:
```powershell
$headers = @{ "x-role" = "GUARDA" }
```

## Endpoints

### Estudiantes
- `POST /estudiantes/primer-ingreso`
- `GET /estudiantes`
- `GET /estudiantes/:id`
- `GET /estudiantes/documento/:documento`

### Movimientos
- `POST /movimientos/registrar`
- `GET /movimientos`
- `GET /movimientos/estudiante/:id`
- `GET /movimientos/dentro-campus`

### Auth/Admin
- `POST /auth/login`
- `GET /admin/reportes`
- `GET /admin/usuarios`

## Reglas implementadas para movimientos
`POST /movimientos/registrar`:
1. Recibe `qr_uid` o `qr_url` en JSON.
2. Busca estudiante por `qr_uid`.
3. Valida que exista.
4. Valida `vigencia = true`.
5. Consulta ultimo movimiento.
6. Alterna tipo (`ENTRADA`/`SALIDA`).
7. Inserta nuevo registro.
8. Retorna JSON con estudiante y movimiento.

## Ejemplos curl

Registrar primer ingreso:
```bash
curl -X POST http://localhost:3000/estudiantes/primer-ingreso \
  -H "Content-Type: application/json" \
  -H "x-role: GUARDA" \
  -d '{
    "documento":"123456",
    "qr_uid":"QR-123",
    "nombre":"Luis Ramon",
    "carrera":"Ingenieria",
    "vigencia":true,
    "placa":"ABC123",
    "color":"Negro"
  }'
```

Registrar movimiento:
```bash
curl -X POST http://localhost:3000/movimientos/registrar \
  -H "Content-Type: application/json" \
  -H "x-role: GUARDA" \
  -d '{"qr_uid":"QR-123"}'
```

Listar movimientos (JOIN estudiantes + orden DESC):
```bash
curl -X GET http://localhost:3000/movimientos \
  -H "x-role: ADMIN"
```

Historial por estudiante:
```bash
curl -X GET http://localhost:3000/movimientos/estudiante/1 \
  -H "x-role: ADMIN"
```

Listar estudiantes:
```bash
curl -X GET http://localhost:3000/estudiantes \
  -H "x-role: CONSULTA"
```

## Pruebas
Desde `backend/`:
```bash
npm test
npm run test:integration
npm run test:all
```

## GitHub
Para subir cambios:
```bash
git add .
git commit -m "Implementa modelos, endpoints de estudiantes/movimientos, validaciones y manejo global de errores"
git push
```
