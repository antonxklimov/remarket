# 🚀 RE→MARKET - Полный гайд по деплою и управлению

## 📋 Содержание
1. [Структура проекта](#структура-проекта)
2. [Как вносить изменения](#как-вносить-изменения)
3. [Процесс деплоя](#процесс-деплоя)
4. [Управление контентом](#управление-контентом)
5. [Техническая информация](#техническая-информация)
6. [Полезные команды](#полезные-команды)
7. [Troubleshooting](#troubleshooting)

---

## 📁 Структура проекта

```
cargo-clone/
├── 🌐 Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # React компоненты
│   │   │   ├── AdminPanel.jsx  # Админка для редактирования
│   │   │   ├── Header.jsx      # Шапка сайта
│   │   │   ├── Sidebar.jsx     # Боковое меню
│   │   │   └── ...            # Другие компоненты
│   │   ├── App.jsx            # Главный компонент
│   │   └── main.jsx           # Точка входа
│   ├── package.json           # Зависимости frontend
│   └── vite.config.js         # Конфигурация сборки
│
├── ⚙️ Backend (Express.js API)
│   ├── backend/
│   │   ├── server.js          # API сервер
│   │   ├── package.json       # Зависимости backend
│   │   ├── data/              # Данные секций (JSON)
│   │   └── uploads/           # Загруженные изображения
│
├── 🔧 Конфигурация
│   ├── nginx.conf             # Конфигурация веб-сервера
│   ├── deploy.sh              # Скрипт автоматического деплоя
│   └── README.md              # Основная документация
│
└── 📦 Сборка
    └── dist/                  # Собранный frontend (создается автоматически)
```

---

## ✏️ Как вносить изменения

### 🎨 Изменения дизайна и контента

#### 1. Редактирование контента (простой способ)
```bash
# Откройте админку в браузере
http://85.192.30.220/?admin=true

# Внесите изменения через интерфейс:
# - Заголовки и тексты
# - Изображения и галереи
# - Порядок секций
# - Настройки отображения

# Нажмите "Сохранить" - данные автоматически сохранятся на сервере
```

#### 2. Редактирование кода (для разработчиков)
```bash
# 1. Клонируйте репозиторий (если еще не сделано)
git clone https://github.com/antonxklimov/remarket.git
cd remarket

# 2. Установите зависимости
npm install --legacy-peer-deps

# 3. Запустите локальную разработку
npm run dev
# Сайт откроется на http://localhost:5173

# 4. Внесите изменения в код
# - src/components/ - компоненты React
# - src/App.css - основные стили
# - src/index.css - глобальные стили

# 5. Протестируйте изменения локально
# Откройте http://localhost:5173/?admin=true для админки

# 6. Сохраните изменения
git add .
git commit -m "Описание изменений"
git push origin main
```

### 🖼️ Добавление новых изображений
```bash
# Через админку (рекомендуется):
1. Откройте http://85.192.30.220/?admin=true
2. Выберите секцию
3. Нажмите "Выберите файл"
4. Загрузите изображение (JPG, PNG, GIF)
5. Нажмите "Сохранить"

# Изображения автоматически:
# - Загружаются на сервер
# - Получают уникальные имена
# - Доступны по URL: /uploads/image-xxxxx.jpg
```

---

## 🚀 Процесс деплоя

### 🔄 Автоматический деплой (рекомендуется)
```bash
# 1. Убедитесь, что изменения сохранены в Git
git status  # Проверить статус
git add .   # Добавить все изменения
git commit -m "Описание изменений"
git push origin main

# 2. Запустите деплой одной командой
./deploy.sh

# Скрипт автоматически:
# ✅ Обновит код с GitHub
# ✅ Соберет frontend проект
# ✅ Загрузит файлы на сервер
# ✅ Установит зависимости backend
# ✅ Перезапустит все сервисы
# ✅ Проверит статус
```

### 🛠️ Ручной деплой (для troubleshooting)
```bash
# 1. Сборка проекта
npm run build

# 2. Загрузка frontend на сервер
scp -i ~/.ssh/id_rsa_server -r dist/* anton@85.192.30.220:/home/anton/sites/remarket/

# 3. Загрузка backend на сервер
scp -i ~/.ssh/id_rsa_server -r backend/* anton@85.192.30.220:/home/anton/sites/remarket-backend/

# 4. Установка зависимостей на сервере
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "cd /home/anton/sites/remarket-backend && npm install --production"

# 5. Перезапуск backend процесса
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "pkill -f 'node.*server.js' || true"
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "cd /home/anton/sites/remarket-backend && nohup node server.js > backend.log 2>&1 & echo \$! > backend.pid"

# 6. Перезагрузка nginx
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo '123456789987654321' | sudo -S systemctl reload nginx"
```

---

## 👥 Управление контентом

### 📝 Админка
```
URL: http://85.192.30.220/?admin=true

Возможности:
✅ Редактирование заголовков и текста
✅ Загрузка изображений (до 10MB)
✅ Создание галерей (до 3 фото)
✅ Изменение порядка секций (кнопки ↑↓)
✅ Скрытие/показ секций
✅ Большие заголовки (11rem)
✅ Rich-text редактор для текста

Данные сохраняются:
📍 На сервере (основное хранилище)
💾 В localStorage браузера (backup)
```

### 📱 Мобильная версия
```
Адаптивный дизайн:
🖥️ Desktop (>900px): sidebar + полноэкранные секции
📱 Tablet (600-900px): компактная версия
📱 Mobile (<600px): мобильный layout

Точки переключения:
- 900px: desktop ↔ tablet
- 600px: tablet ↔ mobile
```

---

## 🔧 Техническая информация

### 🌐 Frontend Stack
```
React 19          # UI библиотека
Vite 7           # Сборщик проекта
Draft.js         # Rich-text редактор
Swiper           # Галереи изображений
Framer Motion    # Анимации

Особенности:
- SPA (Single Page Application)
- Client-side routing
- Responsive design
- Hot reload в разработке
```

### ⚙️ Backend Stack
```
Node.js 20.19.3  # JavaScript runtime
Express.js 4     # Web framework
Multer           # Загрузка файлов
fs-extra         # Работа с файлами
CORS             # Cross-origin запросы

API Endpoints:
GET  /api/health     # Проверка работы
GET  /api/data       # Получить секции
POST /api/data       # Сохранить секции
POST /api/upload     # Загрузить изображение
```

### 🌍 Сервер
```
IP: 85.192.30.220
OS: Ubuntu
Web-server: Nginx 1.24.0
Node.js: 20.19.3

Структура:
/home/anton/sites/remarket/         # Frontend файлы
/home/anton/sites/remarket-backend/ # Backend API
/etc/nginx/sites-enabled/remarket   # Nginx конфигурация

Процессы:
nginx    # Веб-сервер (порт 80)
node     # Backend API (порт 3001)
```

---

## 💻 Полезные команды

### 🔍 Проверка статуса
```bash
# Проверить все компоненты
curl http://85.192.30.220/                    # Сайт
curl http://85.192.30.220/?admin=true         # Админка  
curl http://85.192.30.220/api/health          # API
curl http://85.192.30.220/api/data            # Данные

# Проверить процессы на сервере
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ps aux | grep nginx"
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ps aux | grep node"

# Проверить логи
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "tail -20 /home/anton/sites/remarket-backend/backend.log"
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "tail -20 /var/log/nginx/remarket_error.log"
```

### 🔄 Управление сервисами
```bash
# Перезапуск nginx
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo '123456789987654321' | sudo -S systemctl restart nginx"

# Перезапуск backend
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "pkill -f 'node.*server.js'"
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "cd /home/anton/sites/remarket-backend && nohup node server.js > backend.log 2>&1 &"

# Проверка конфигурации nginx
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo '123456789987654321' | sudo -S nginx -t"
```

### 📊 Мониторинг
```bash
# Размер файлов
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "du -sh /home/anton/sites/remarket*"

# Использование диска
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "df -h"

# Загруженные изображения
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ls -la /home/anton/sites/remarket-backend/uploads/"

# Текущие данные
curl -s http://85.192.30.220/api/data | jq '.'  # Если установлен jq
```

---

## 🆘 Troubleshooting

### ❌ Проблема: Сайт не открывается
```bash
# Проверить nginx
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo '123456789987654321' | sudo -S systemctl status nginx"

# Перезапустить nginx
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo '123456789987654321' | sudo -S systemctl restart nginx"

# Проверить файлы
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ls -la /home/anton/sites/remarket/"
```

### ❌ Проблема: Админка не сохраняет данные
```bash
# Проверить backend API
curl http://85.192.30.220/api/health

# Проверить логи backend
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "tail -20 /home/anton/sites/remarket-backend/backend.log"

# Перезапустить backend
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "pkill -f 'node.*server.js' && cd /home/anton/sites/remarket-backend && nohup node server.js > backend.log 2>&1 &"
```

### ❌ Проблема: Изображения не загружаются
```bash
# Проверить права доступа
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ls -la /home/anton/sites/remarket-backend/uploads/"

# Тест загрузки
curl -X POST -F "image=@some_image.jpg" http://85.192.30.220/api/upload

# Проверить nginx конфигурацию
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo '123456789987654321' | sudo -S nginx -t"
```

### ❌ Проблема: Деплой не работает
```bash
# Проверить SSH ключи
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "echo 'SSH работает'"

# Проверить Git репозиторий
git status
git pull origin main

# Ручная сборка
npm run build
ls -la dist/

# Проверить место на диске сервера
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "df -h"
```

### 🔄 Полный сброс (крайний случай)
```bash
# 1. Остановить все процессы
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "pkill -f 'node.*server.js'"

# 2. Очистить файлы
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "rm -rf /home/anton/sites/remarket*"

# 3. Полный деплой
./deploy.sh

# 4. Восстановить данные по умолчанию
curl -X POST -H "Content-Type: application/json" -d '{"sections":[{"id":"hero","title":"Пятый фестиваль локальных брендов RE→MARKET","text":"Фестиваль локальных брендов в Москве. Встречаемся 3 августа 2025 года в самом сердце города.","image":"","gallery":[],"galleryEnabled":false,"hidden":false,"largeTitle":true}]}' "http://85.192.30.220/api/data"
```

---

## 📞 Контакты и ресурсы

### 🌐 Ссылки
- **Сайт**: http://85.192.30.220/
- **Админка**: http://85.192.30.220/?admin=true
- **API Health**: http://85.192.30.220/api/health
- **GitHub**: https://github.com/antonxklimov/remarket

### 📚 Документация
- `README.md` - Основная информация
- `API_USAGE.md` - Информация об API
- `DEPLOYMENT_GUIDE.md` - Этот гайд

### 🔑 Данные доступа
```
Сервер: 85.192.30.220
Пользователь: anton
SSH ключ: ~/.ssh/id_rsa_server
Пароль sudo: 123456789987654321

GitHub: https://github.com/antonxklimov/remarket
```

---

## ⚡ Quick Start (для новых разработчиков)

```bash
# 1. Клонирование проекта
git clone https://github.com/antonxklimov/remarket.git
cd remarket

# 2. Установка зависимостей
npm install --legacy-peer-deps

# 3. Локальная разработка
npm run dev
# Откроется http://localhost:5173

# 4. Сборка проекта
npm run build

# 5. Деплой на сервер
./deploy.sh

# 6. Проверка результата
curl http://85.192.30.220/api/health
```

---

**🎯 Проект готов к использованию!**  
*RE→MARKET 2025 - Локальные бренды, серверные технологии* 