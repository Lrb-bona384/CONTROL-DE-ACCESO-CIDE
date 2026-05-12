# Lanzamiento SIUC: CI/CD y despliegue gratuito

## Stack recomendado para el MVP

| Bloque | Servicio | Motivo |
| --- | --- | --- |
| CI/CD | GitHub Actions | Corre pruebas y build antes de aceptar cambios en `develop` o `main`. |
| Frontend | Vercel | Encaja directo con React + Vite y despliega desde GitHub. |
| Backend | Render | Permite correr el backend Express actual sin migrarlo a funciones serverless. |
| Base de datos | Supabase PostgreSQL | Compatible con `pg` y útil para pasar de PostgreSQL local a nube. |
| Archivos | Supabase Storage | Mejor que guardar adjuntos en disco local del servidor. |
| Correos | Brevo o Resend | Evita depender de SMTP Gmail en hosting gratuito. |

## Flujo de ramas

```text
develop -> pruebas internas y demo previa
main    -> version estable para lanzamiento
```

## Pipeline actual

El archivo `.github/workflows/ci.yml` se ejecuta en:

- push a `develop`
- push a `main`
- pull request hacia `develop` o `main`

Validaciones:

1. instala dependencias del backend con `npm ci`
2. crea un `.env` temporal desde `.env.example`
3. corre `npm run test:ci` en backend
4. instala dependencias del frontend con `npm ci`
5. corre `npm test` en frontend
6. corre `npm run build` en frontend

Nota: `npm run test:ci` evita pruebas dependientes del servidor local completo o una base PostgreSQL local. Esas pruebas quedan para verificación manual o ambiente de staging.

## Variables esperadas en producción

### Backend Render

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://URL-DEL-FRONTEND.vercel.app
DB_USER=...
DB_HOST=...
DB_NAME=...
DB_PASSWORD=...
DB_PORT=6543
DB_SSL=true
JWT_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=SIUC <no-reply@cide.edu.co>
SMTP_CC=...
SOLICITUDES_REVIEW_CC=...
SOLICITUDES_EXPIRE_AUTORUN=true
SOLICITUDES_EXPIRE_INTERVAL_MS=300000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=solicitudes
```

`CORS_ORIGIN` puede recibir varios dominios separados por coma si se requiere staging y producción:

```env
CORS_ORIGIN=https://siuc-staging.vercel.app,https://siuc.vercel.app
```

### Frontend Vercel

Si el frontend necesita apuntar explícitamente al backend desplegado, definir:

```env
VITE_API_URL=https://URL-DEL-BACKEND.onrender.com
```

En desarrollo local se puede dejar vacío. Cuando `VITE_API_URL` no existe, el frontend usa `/api` y Vite lo redirige al backend local `http://localhost:3000`.

## Orden recomendado de lanzamiento

1. Confirmar que GitHub Actions pasa en `develop`.
2. Crear proyecto Supabase y migrar esquema PostgreSQL.
3. Crear buckets de Storage para adjuntos.
4. Crear servicio backend en Render.
5. Crear proyecto frontend en Vercel.
6. Configurar variables de entorno en Render y Vercel.
7. Probar login, movimientos, admisiones, correos y visitantes.
8. Subir versión estable a `main`.

## Vercel

Configuración sugerida:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variable: `VITE_API_URL=https://URL-DEL-BACKEND.onrender.com`

El archivo `frontend/vercel.json` redirige rutas internas como `/admin`, `/movimientos` o `/inscripcion` hacia `index.html`.

## Render

Se agregó `render.yaml` para documentar el servicio backend:

- Root Directory: `backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check: `/health`
- Plan: `free`
- Para Supabase desde Render usar el pooler transaccional con `DB_PORT=6543` y `DB_SSL=true`.

En Render se deben cargar las variables sensibles manualmente. No se suben claves ni contraseñas al repositorio.

## Supabase

Configuración recomendada:

- Crear proyecto Supabase.
- Crear la base PostgreSQL.
- Ejecutar el esquema del proyecto en la base de Supabase.
- Crear bucket de Storage llamado `solicitudes`.
- Si se quieren enlaces públicos simples para los adjuntos, dejar el bucket público.
- Copiar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en Render.

Cuando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están definidos, los adjuntos del formulario se guardan en Supabase Storage. Si no están definidos, el sistema conserva el comportamiento local actual en `backend/public/uploads/solicitudes`.

## Riesgos conocidos

- Render gratuito puede dormir tras inactividad; el primer acceso puede tardar.
- Si no se configuran las variables de Supabase, el backend guardará adjuntos en disco local del servidor.
- Gmail SMTP puede fallar en hosting gratuito; para producción conviene Brevo o Resend.
