#!/bin/bash
# Script de pruebas para los endpoints del backend
# Uso: bash test-endpoints.sh

BASE_URL="http://localhost:3000"
ADMIN_TOKEN=""

echo "🧪 Iniciando pruebas del Backend..."
echo "📍 URL base: $BASE_URL"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "${YELLOW}1. Verificar salud del servidor${NC}"
curl -s -X GET "$BASE_URL/health" | jq '.' 2>/dev/null || echo "  ✗ Server no responde"
echo ""

# 2. Login - Admin
echo -e "${YELLOW}2. Login con usuario admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }')
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
echo "  Token obtenido: ${ADMIN_TOKEN:0:20}..."
echo ""

# 3. Login - Staff
echo -e "${YELLOW}3. Login con usuario staff${NC}"
STAFF_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff",
    "password": "Staff123!"
  }')
echo "$STAFF_RESPONSE" | jq '.' 2>/dev/null || echo "$STAFF_RESPONSE"
echo ""

# 4. Login con credenciales inválidas
echo -e "${YELLOW}4. Login con credenciales inválidas${NC}"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "incorrect"
  }' | jq '.' 2>/dev/null || echo "Credenciales rechazadas"
echo ""

# 5. Primer ingreso de estudiante
echo -e "${YELLOW}5. Registrar primer ingreso de estudiante${NC}"
curl -s -X POST "$BASE_URL/estudiantes/primer-ingreso" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "documento": "102030405",
    "qr_uid": "QR12345",
    "nombre": "Luis Ramón",
    "carrera": "Ingeniería Mecatrónica",
    "vigencia": true,
    "placa": "ABC-123",
    "color": "Negro"
  }' | jq '.' 2>/dev/null || echo "Error en primer ingreso"
echo ""

# 6. Listar estudiantes dentro del campus
echo -e "${YELLOW}6. Listar estudiantes dentro del campus${NC}"
curl -s -X GET "$BASE_URL/movimientos/dentro-campus" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.' 2>/dev/null || echo "Error listando estudiantes"
echo ""

echo -e "${GREEN}✅ Pruebas completadas${NC}"
