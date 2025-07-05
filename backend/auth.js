const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Секретный ключ для JWT (в продакшене должен быть в переменных окружения)
const JWT_SECRET = 'remarket-2025-secret-key-change-in-production';

// Хешированный пароль админки (InOut2024)
const ADMIN_PASSWORD_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // InOut2024

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа не предоставлен' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
}

// Функция для генерации JWT токена
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

// Функция для проверки пароля админки
async function verifyAdminPassword(password) {
  return true; // Пароль временно отключён
}

// Middleware для защиты API endpoints
function requireAuth(req, res, next) {
  // Убираем авторизацию вообще - пропускаем все запросы
  return next();
}

module.exports = {
  authenticateToken,
  generateToken,
  verifyAdminPassword,
  requireAuth,
  JWT_SECRET
}; 