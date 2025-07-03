const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'sections.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Создаем директории если их нет
async function ensureDirectories() {
    await fs.ensureDir(path.dirname(DATA_FILE));
    await fs.ensureDir(UPLOADS_DIR);
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Начальные данные по умолчанию
const defaultSections = [
    {
        id: 'hero',
        title: 'Пятый фестиваль локальных брендов RE→MARKET',
        text: 'Фестиваль локальных брендов в Москве. Встречаемся 3 августа 2025 года в самом сердце города.',
        image: '',
        gallery: [],
        galleryEnabled: false,
        hidden: false
    }
];

// Функция для загрузки данных
async function loadData() {
    try {
        if (await fs.pathExists(DATA_FILE)) {
            const data = await fs.readJSON(DATA_FILE);
            return data;
        } else {
            // Если файла нет, создаем с данными по умолчанию
            await saveData(defaultSections);
            return defaultSections;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        return defaultSections;
    }
}

// Функция для сохранения данных
async function saveData(sections) {
    try {
        await fs.writeJSON(DATA_FILE, sections, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return false;
    }
}

// API Routes

// GET /api/data - получить все секции
app.get('/api/data', async (req, res) => {
    try {
        const sections = await loadData();
        res.json(sections);
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// POST /api/data - сохранить все секции
app.post('/api/data', async (req, res) => {
    try {
        const { sections } = req.body;
        
        if (!Array.isArray(sections)) {
            return res.status(400).json({ error: 'Данные должны быть массивом секций' });
        }
        
        const success = await saveData(sections);
        
        if (success) {
            res.json({ message: 'Данные успешно сохранены', sections });
        } else {
            res.status(500).json({ error: 'Ошибка сохранения данных' });
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST /api/upload - загрузка изображений
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        // Возвращаем URL загруженного файла
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            message: 'Файл успешно загружен',
            url: fileUrl,
            filename: req.file.filename 
        });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// GET /api/health - проверка работы сервера
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'RE→MARKET Backend API работает',
        timestamp: new Date().toISOString()
    });
});

// Запуск сервера
async function startServer() {
    await ensureDirectories();
    
    app.listen(PORT, () => {
        console.log(`🚀 RE→MARKET Backend API запущен на порту ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📝 API endpoints:`);
        console.log(`   GET  /api/data - получить данные`);
        console.log(`   POST /api/data - сохранить данные`);
        console.log(`   POST /api/upload - загрузить изображение`);
    });
}

startServer().catch(console.error); 