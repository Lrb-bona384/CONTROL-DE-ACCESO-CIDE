# 📦 Configuración de Base de Datos

## Requisitos
- PostgreSQL 12+ instalado y ejecutándose
- Usuario: `postgres`
- Base de datos: `control_acceso_cide`

## Pasos para Configurar

### 1. Crear la base de datos (una sola vez)
```bash
createdb -U postgres control_acceso_cide
```

### 2. Aplicar el esquema principal
```bash
psql -U postgres -d control_acceso_cide -f backend/database/schema.sql
```

### 3. Insertar usuarios de prueba
```bash
psql -U postgres -d control_acceso_cide -f backend/database/seed-usuarios.sql
```

## Alternativa: Ejecutar el Script Node con BD disponible
Si prefieres que Node ejecute el seed automáticamente:

```bash
cd backend
npm install  # Si no lo has hecho
node database/seed.js
```

## Usuarios de Prueba Disponibles

| Usuario | Contraseña | Rol | Propósito |
|---------|-----------|-----|----------|
| `admin` | `Admin123!` | admin | Administrador del sistema |
| `staff` | `Staff123!` | staff | Personal para registros |
| `test` | `Test123!` | staff | Pruebas generales |

## Verificar la Configuración

### Listar usuarios creados
```sql
SELECT id, username, role, created_at FROM usuarios;
```

### Verificar todas las tablas
```sql
\dt  -- En psql
```

Debería mostrar:
- `estudiantes`
- `motocicletas`
- `movimientos`
- `usuarios`

## Verificar Conexión desde Node
```bash
cd backend
node -e "const pool = require('./config/database'); pool.query('SELECT NOW()').then(r => { console.log('✓ BD conectada:', r.rows[0]); process.exit(0); }).catch(e => { console.error('✗ Error:', e.message); process.exit(1); })"
```

## Troubleshooting

### Error: "la autentificación password falló"
- Verifica que PostgreSQL está ejecutándose
- Verifica la contraseña en `backend/config/database.js`
- Intenta conectar manualmente: `psql -U postgres`

### Error: "database does not exist"
- Ejecuta: `createdb -U postgres control_acceso_cide`

### Error: "role does not exist"
- Crea el usuario PostgreSQL: `createuser -U postgres [usuario]`
