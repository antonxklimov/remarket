const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const Jimp = require('jimp');
const rateLimit = require('express-rate-limit');
const { generateToken, verifyAdminPassword, requireAuth } = require('./auth');

const app = express();
const PORT = 3001;

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data', 'sections.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Создаем директории если их нет
async function ensureDirectories() {
    await fs.ensureDir(path.dirname(DATA_FILE));
    await fs.ensureDir(UPLOADS_DIR);
    await fs.ensureDir(TEMP_UPLOADS_DIR);
}

// Функция для оптимизации изображений (ресайз 50% + качество 90%)
async function optimizeImage(inputPath, outputPath, maxWidth = 1200, maxHeight = 1200) {
    const image = await Jimp.read(inputPath);
    // Определяем новые размеры
    let { width, height } = image.bitmap;
    let newWidth = width;
    let newHeight = height;
    if (width > maxWidth || height > maxHeight) {
        const aspect = width / height;
        if (width > height) {
            newWidth = maxWidth;
            newHeight = Math.round(maxWidth / aspect);
        } else {
            newHeight = maxHeight;
            newWidth = Math.round(maxHeight * aspect);
        }
    }
    image.resize(newWidth, newHeight);
    // Определяем формат по расширению
    const ext = inputPath.split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') {
        await image.quality(90).writeAsync(outputPath);
    } else if (ext === 'png') {
        await image.quality(90).writeAsync(outputPath); // Jimp quality влияет только на JPEG, но PNG всё равно сохранится
    } else if (ext === 'webp') {
        await image.quality(90).writeAsync(outputPath); // Jimp поддерживает webp
    } else {
        await image.writeAsync(outputPath);
    }
}

// Настройка multer для загрузки файлов (временная папка)
const TEMP_UPLOADS_DIR = path.join(__dirname, 'temp_uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, TEMP_UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB лимит
        files: 1 // Максимум 1 файл за раз
    },
    fileFilter: (req, file, cb) => {
        // Разрешаем только изображения
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения'));
        }
    }
});

// Rate limiting для защиты от брутфорса
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 попыток
    message: { error: 'Слишком много попыток входа. Попробуйте позже.' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
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

// POST /api/login - аутентификация админки
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Пароль обязателен' });
        }
        
        const isValid = await verifyAdminPassword(password);
        
        if (isValid) {
            const token = generateToken('admin');
            res.json({ 
                message: 'Успешная аутентификация',
                token,
                expiresIn: '24h'
            });
        } else {
            res.status(401).json({ error: 'Неверный пароль' });
        }
    } catch (error) {
        console.error('Ошибка аутентификации:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// GET /api/health - проверка статуса API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'RE→MARKET Backend API работает',
        timestamp: new Date().toISOString()
    });
});

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

// POST /api/data - сохранить все секции (требует аутентификации)
app.post('/api/data', requireAuth, async (req, res) => {
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

// POST /api/upload - загрузка изображений с автоматической оптимизацией (требует аутентификации)
app.post('/api/upload', requireAuth, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Ошибка multer:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Файл слишком большой. Максимум 50MB.' });
            }
            return res.status(400).json({ error: `Ошибка загрузки: ${err.message}` });
        } else if (err) {
            console.error('Ошибка загрузки файла:', err);
            return res.status(400).json({ error: err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Файл не загружен' });
            }
            
            console.log('Файл успешно загружен во временную папку:', req.file.filename);
            
            // Пути для временного и оптимизированного файлов
            const tempPath = req.file.path;
            const optimizedFilename = req.file.filename;
            const optimizedPath = path.join(UPLOADS_DIR, optimizedFilename);
            
            // Оптимизируем изображение (ресайз 50% + качество 90%)
            const optimized = await optimizeImage(tempPath, optimizedPath);
            
            if (!optimized) {
                // Если оптимизация не удалась, копируем оригинал
                await fs.copy(tempPath, optimizedPath);
                console.log('Оптимизация не удалась, сохранен оригинал');
            }
            
            // Удаляем временный файл
            await fs.remove(tempPath);
            
            // Возвращаем URL оптимизированного файла
            const fileUrl = `/uploads/${optimizedFilename}`;
            res.json({ 
                message: optimized ? 'Файл успешно загружен и оптимизирован (50% размер, 90% качество)' : 'Файл успешно загружен (оптимизация временно отключена)',
                url: fileUrl,
                filename: optimizedFilename,
                optimized: optimized
            });
        } catch (error) {
            console.error('Ошибка обработки файла:', error);
            
            // Очистка временного файла в случае ошибки
            if (req.file && req.file.path) {
                try {
                    await fs.remove(req.file.path);
                } catch (cleanupError) {
                    console.error('Ошибка очистки временного файла:', cleanupError);
                }
            }
            
            res.status(500).json({ error: 'Ошибка обработки файла' });
        }
    });
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