const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

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
async function optimizeImage(inputPath, outputPath) {
    try {
        const metadata = await sharp(inputPath).metadata();
        console.log(`Обрабатываю изображение: ${metadata.width}x${metadata.height} -> ${Math.round(metadata.width * 0.5)}x${Math.round(metadata.height * 0.5)}`);
        
        const newWidth = Math.round(metadata.width * 0.5);
        const newHeight = Math.round(metadata.height * 0.5);
        
        // Обрабатываем изображение: ресайз до 50% + качество 90%
        await sharp(inputPath)
            .resize(newWidth, newHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .png({ quality: 90 })
            .webp({ quality: 90 })
            .toFile(outputPath);
        
        console.log(`Изображение оптимизировано: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('Ошибка оптимизации изображения:', error);
        return false;
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

// POST /api/upload - загрузка изображений с автоматической оптимизацией
app.post('/api/upload', (req, res) => {
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
                message: optimized ? 'Файл успешно загружен и оптимизирован (50% размер, 90% качество)' : 'Файл успешно загружен',
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