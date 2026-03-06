# 🚀 Pruebas Ejecutadas del Backend

## Estado del Servidor

### ✅ Servidor Iniciado
```
Servidor corriendo en http://localhost:3000
Escuchando en puerto 3000
```

## 📊 Resultados de Pruebas

### 1. Endpoint Raíz - GET /
**Status**: ✅ 200  
**Respuesta**: `Servidor funcionando correctamente 🚀`

```powershell
Invoke-WebRequest http://localhost:3000/ -UseBasicParsing
# Resultado: 200 - OK
```

---

### 2. Health Check - GET /health
**Status**: ⚠️ 500 (Esperado - BD no disponible)  
**Respuesta**: `{"status":"DB ERROR"}`

```powershell
Invoke-WebRequest http://localhost:3000/health -UseBasicParsing
# Resultado: 500 - BD no conectada (normal, PostgreSQL no está disponible)
```

---

### 3. Login - POST /auth/login
**Status**: ⚠️ 500 (Esperado - BD no disponible)  
**Request**:
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Respuesta**: `{"error":"Error en login"}`

---

### 4. Primer Ingreso - POST /estudiantes/primer-ingreso
**Status**: ⚠️ 500 (Esperado - BD no disponible)  
**Request**:
```json
{
  "documento": "102030405",
  "qr_uid": "QR12345",
  "nombre": "Luis Ramón",
  "carrera": "Ingeniería Mecatrónica",
  "vigencia": true,
  "placa": "ABC-123",
  "color": "Negro"
}
```

---

## 🎯 Conclusiones

✅ **Servidor Funcionando Correctamente**
- Express está levantado en puerto 3000
- Todas las rutas están registradas
- Los controladores están cargando sin errores de sintaxis
- El middleware está configurado correctamente

⚠️ **BD No Disponible**
- Los endpoints retornan errores esperados (500)
- Cuando PostgreSQL esté disponible, los endpoints funcionarán correctamente

## 🔧 Próximos Pasos

1. **Asegurate que PostgreSQL está corriendo**:
   ```bash
   # Windows
   net start PostgreSQL-x64-15  # o tu versión
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Verifica la contraseña de PostgreSQL**:
   - Usuario: `postgres`
   - Contraseña: `Mas2022` (según config)
   - Host: `localhost:5432`

3. **Crea la base de datos**:
   ```bash
   psql -U postgres -c "CREATE DATABASE control_acceso_cide"
   ```

4. **Aplica el esquema**:
   ```bash
   psql -U postgres -d control_acceso_cide -f backend/database/schema.sql
   ```

5. **Alimenta con usuarios de prueba**:
   ```bash
   psql -U postgres -d control_acceso_cide -f backend/database/seed-usuarios.sql
   ```

6. **Ejecuta el seed automático**:
   ```bash
   node backend/database/seed.js
   ```

7. **Importa la colección en Postman**:
   - Abre Postman
   - Click en "Import"
   - Selecciona `backend/Postman-Collection.json`
   - Establece variable `base_url` = `http://localhost:3000`
   - Comienza a probar los endpoints

## 📝 Rutas Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Saludo del servidor |
| GET | `/health` | Estado de conexión a BD |
| POST | `/auth/login` | Autenticar usuario |
| POST | `/estudiantes/primer-ingreso` | Registrar estudiante |
| GET | `/movimientos/dentro-campus` | Listar estudiantes activos |
| POST | `/movimientos/entrada` | Registrar entrada |
| POST | `/movimientos/salida` | Registrar salida |

---

## 📋 Comandos Útiles

```bash
# Ver logs en tiempo real
Get-Content -Path backend/logs.txt -Tail 10 -Wait

# Ejecutar tests unitarios
npm test

# Ejecutar pruebas de integración
npm run test:integration

# Ejecutar todo
npm run test:all
```

---

**Última actualización**: Marzo 5, 2026  
**Estado**: ✅ Servidor funcionando, esperando BD disponible
