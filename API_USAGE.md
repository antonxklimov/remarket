# 🔌 RE→MARKET API - Документация

## 📋 Обзор API

Backend API предоставляет RESTful интерфейс для управления данными фестиваля RE→MARKET. Используется Express.js с JSON хранилищем данных.

**Base URL**: `http://85.192.30.220/api/`

---

## 🛠️ Endpoints

### 1. Health Check
```http
GET /api/health
```

**Описание**: Проверка работоспособности API

**Ответ**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 1234567
}
```

### 2. Получить данные секций
```http
GET /api/data
```

**Описание**: Получение всех секций сайта

**Ответ**:
```json
{
  "sections": [
    {
      "id": "hero",
      "title": "Пятый фестиваль локальных брендов RE→MARKET",
      "text": "Фестиваль локальных брендов в Москве...",
      "image": "/uploads/image-1737023456789.jpg",
      "gallery": [
        "/uploads/gallery-1737023456790.jpg",
        "/uploads/gallery-1737023456791.jpg"
      ],
      "galleryEnabled": true,
      "hidden": false,
      "largeTitle": true
    }
  ]
}
```

### 3. Сохранить данные секций
```http
POST /api/data
Content-Type: application/json
```

**Описание**: Сохранение обновленных данных секций

**Тело запроса**:
```json
{
  "sections": [
    {
      "id": "hero",
      "title": "Новый заголовок",
      "text": "Новый текст",
      "image": "/uploads/image-123.jpg",
      "gallery": [],
      "galleryEnabled": false,
      "hidden": false,
      "largeTitle": true
    }
  ]
}
```

**Ответ**:
```json
{
  "message": "Данные успешно сохранены",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 4. Загрузка изображения
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Описание**: Загрузка изображения на сервер

**Тело запроса**:
```
Form data:
- image: [файл изображения]
```

**Ответ**:
```json
{
  "message": "Изображение успешно загружено",
  "imageUrl": "/uploads/image-1737023456789.jpg",
  "filename": "image-1737023456789.jpg"
}
```

---

## 📦 Структура данных

### Section Object
```typescript
interface Section {
  id: string;           // Уникальный идентификатор
  title: string;        // Заголовок секции
  text: string;         // Текст секции (HTML)
  image: string;        // URL основного изображения
  gallery: string[];    // Массив URL изображений галереи
  galleryEnabled: boolean; // Включена ли галерея
  hidden: boolean;      // Скрыта ли секция
  largeTitle: boolean;  // Большой заголовок (11rem)
}
```

### API Response Format
```typescript
interface ApiResponse {
  message?: string;     // Сообщение о результате
  timestamp?: string;   // Время операции
  sections?: Section[]; // Массив секций (для GET /data)
  imageUrl?: string;    // URL изображения (для POST /upload)
  filename?: string;    // Имя файла (для POST /upload)
  status?: string;      // Статус (для GET /health)
  uptime?: number;      // Время работы (для GET /health)
}
```

---

## 🔧 Технические детали

### Ограничения загрузки файлов
- **Максимальный размер**: 10MB
- **Поддерживаемые форматы**: JPG, JPEG, PNG, GIF
- **Именование**: `image-{timestamp}.{ext}` или `gallery-{timestamp}.{ext}`

### Хранение данных
- **Секции**: `/home/anton/sites/remarket-backend/data/sections.json`
- **Изображения**: `/home/anton/sites/remarket-backend/uploads/`
- **Логи**: `/home/anton/sites/remarket-backend/backend.log`

### CORS настройки
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

---

## 🔍 Примеры использования

### cURL команды

#### Проверка API
```bash
curl http://85.192.30.220/api/health
```

#### Получение данных
```bash
curl http://85.192.30.220/api/data
```

#### Загрузка изображения
```bash
curl -X POST -F "image=@photo.jpg" http://85.192.30.220/api/upload
```

#### Сохранение данных
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"sections":[{"id":"test","title":"Test","text":"Test text","image":"","gallery":[],"galleryEnabled":false,"hidden":false,"largeTitle":false}]}' \
  http://85.192.30.220/api/data
```

### JavaScript (Frontend)

#### Получение данных
```javascript
const response = await fetch('/api/data');
const data = await response.json();
console.log(data.sections);
```

#### Загрузка изображения
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.imageUrl);
```

#### Сохранение данных
```javascript
const response = await fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sections: sectionsData })
});

const result = await response.json();
console.log(result.message);
```

---

## 🚨 Обработка ошибок

### HTTP Status Codes
- **200**: OK - Успешный запрос
- **400**: Bad Request - Неверный запрос
- **404**: Not Found - Ресурс не найден
- **500**: Internal Server Error - Ошибка сервера

### Примеры ошибок

#### Ошибка загрузки файла
```json
{
  "error": "Файл не выбран"
}
```

#### Ошибка сохранения данных
```json
{
  "error": "Ошибка сохранения данных",
  "details": "ENOENT: no such file or directory"
}
```

#### Ошибка размера файла
```json
{
  "error": "File too large"
}
```

---

## 🔄 Мониторинг и логирование

### Логи сервера
```bash
# Просмотр логов
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "tail -50 /home/anton/sites/remarket-backend/backend.log"

# Мониторинг в реальном времени
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "tail -f /home/anton/sites/remarket-backend/backend.log"
```

### Мониторинг процессов
```bash
# Проверка процесса Node.js
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ps aux | grep 'node.*server.js'"

# Проверка использования памяти
ssh -i ~/.ssh/id_rsa_server anton@85.192.30.220 "ps aux --sort=-%mem | grep node"
```

---

## ⚙️ Конфигурация

### Nginx Proxy Rules
```nginx
# API requests
location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Image uploads
location /uploads/ {
    alias /home/anton/sites/remarket-backend/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Environment Variables
```bash
# Port для API сервера
PORT=3001

# Путь к данным
DATA_PATH=/home/anton/sites/remarket-backend/data

# Путь к загрузкам
UPLOADS_PATH=/home/anton/sites/remarket-backend/uploads
```

---

**🔌 API готов к использованию!**  
*Backend для RE→MARKET 2025* 