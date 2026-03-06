-- ============================================
-- SCRIPT: Crear tabla usuarios y seed inicial
-- ============================================

-- Crear tabla usuarios si no existe
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nota: Los hashes abajo son contraseñas hasheadas con bcrypt
-- Admin: password123
-- Staff: staff123
-- Test: test123

-- Insertar usuarios de prueba (elimina este bloque si los usuarios ya existen)
INSERT INTO usuarios (username, password_hash, role) VALUES 
  ('admin', '$2b$10$IFKmIHq.cGPQZJbg80g.deTTHSHSntegQEuUCqzjls/rzB7j7zvmS', 'admin'),
  ('staff', '$2b$10$ISK1yZuNYDk4vUSlKTDlmuvxqtVr/EEUWFsZ/66cNvAnQn8aeXhqW', 'staff'),
  ('test', '$2b$10$9GTHKgRfgpdEhxlkYOV0gu0LS4xCMrgR/M.ggYTGtGk2LmST6JvaG', 'staff')
ON CONFLICT (username) DO NOTHING;

-- Verificar usuarios creados
SELECT id, username, role, created_at FROM usuarios ORDER BY id;

-- ============================================
-- Contraseñas para pruebas:
-- ============================================
-- Usuario: admin - Contraseña: Admin123!
-- Usuario: staff - Contraseña: Staff123!
-- Usuario: test - Contraseña: Test123!
