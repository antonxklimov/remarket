import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = '/api';

export function useUploadManager() {
  const [uploads, setUploads] = useState(new Map());
  const abortControllers = useRef(new Map());

  // Создать новую загрузку
  const createUpload = useCallback((id, file) => {
    const upload = {
      id,
      file,
      status: 'pending', // pending, uploading, paused, completed, error, cancelled
      progress: 0,
      url: null,
      error: null,
      startTime: Date.now(),
      pauseTime: null,
      totalPausedTime: 0
    };

    setUploads(prev => new Map(prev).set(id, upload));
    return upload;
  }, []);

  // Начать загрузку
  const startUpload = useCallback(async (id, file, authHeaders) => {
    const upload = createUpload(id, file);
    
    // Создаем AbortController для возможности отмены
    const abortController = new AbortController();
    abortControllers.current.set(id, abortController);

    try {
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.set(id, { ...upload, status: 'uploading' });
        return newUploads;
      });

      const formData = new FormData();
      formData.append('image', file);

      // Создаем XMLHttpRequest для отслеживания прогресса
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Отслеживаем прогресс
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploads(prev => {
              const newUploads = new Map(prev);
              const currentUpload = newUploads.get(id);
              if (currentUpload && currentUpload.status === 'uploading') {
                newUploads.set(id, { ...currentUpload, progress });
              }
              return newUploads;
            });
          }
        });

        // Обработка завершения
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result && result.url) {
                setUploads(prev => {
                  const newUploads = new Map(prev);
                  newUploads.set(id, { 
                    ...newUploads.get(id), 
                    status: 'completed', 
                    progress: 100, 
                    url: result.url 
                  });
                  return newUploads;
                });
                resolve(result.url);
              } else {
                throw new Error('Сервер не вернул URL изображения');
              }
            } catch (error) {
              setUploads(prev => {
                const newUploads = new Map(prev);
                newUploads.set(id, { 
                  ...newUploads.get(id), 
                  status: 'error', 
                  error: error.message 
                });
                return newUploads;
              });
              reject(error);
            }
          } else {
            const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            setUploads(prev => {
              const newUploads = new Map(prev);
              newUploads.set(id, { 
                ...newUploads.get(id), 
                status: 'error', 
                error: error.message 
              });
              return newUploads;
            });
            reject(error);
          }
        });

        // Обработка ошибок
        xhr.addEventListener('error', () => {
          const error = new Error('Ошибка сети');
          setUploads(prev => {
            const newUploads = new Map(prev);
            newUploads.set(id, { 
              ...newUploads.get(id), 
              status: 'error', 
              error: error.message 
            });
            return newUploads;
          });
          reject(error);
        });

        // Обработка отмены
        xhr.addEventListener('abort', () => {
          setUploads(prev => {
            const newUploads = new Map(prev);
            newUploads.set(id, { 
              ...newUploads.get(id), 
              status: 'cancelled' 
            });
            return newUploads;
          });
          reject(new Error('Загрузка отменена'));
        });

        // Открываем соединение
        xhr.open('POST', `${API_BASE_URL}/upload`);
        
        // Добавляем заголовки авторизации
        Object.entries(authHeaders).forEach(([key, value]) => {
          if (key !== 'Content-Type') { // Content-Type установит браузер для FormData
            xhr.setRequestHeader(key, value);
          }
        });

        // Отправляем данные
        xhr.send(formData);

        // Сохраняем xhr для возможности отмены
        abortControllers.current.set(id, { xhr, abortController });
      });

    } catch (error) {
      setUploads(prev => {
        const newUploads = new Map(prev);
        newUploads.set(id, { 
          ...upload, 
          status: 'error', 
          error: error.message 
        });
        return newUploads;
      });
      throw error;
    }
  }, [createUpload]);

  // Приостановить загрузку
  const pauseUpload = useCallback((id) => {
    setUploads(prev => {
      const newUploads = new Map(prev);
      const upload = newUploads.get(id);
      if (upload && upload.status === 'uploading') {
        newUploads.set(id, { 
          ...upload, 
          status: 'paused', 
          pauseTime: Date.now() 
        });
      }
      return newUploads;
    });
  }, []);

  // Возобновить загрузку
  const resumeUpload = useCallback((id) => {
    setUploads(prev => {
      const newUploads = new Map(prev);
      const upload = newUploads.get(id);
      if (upload && upload.status === 'paused') {
        const pausedDuration = Date.now() - upload.pauseTime;
        newUploads.set(id, { 
          ...upload, 
          status: 'uploading', 
          pauseTime: null,
          totalPausedTime: upload.totalPausedTime + pausedDuration
        });
      }
      return newUploads;
    });
  }, []);

  // Отменить загрузку
  const cancelUpload = useCallback((id) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      if (controller.xhr) {
        controller.xhr.abort();
      }
      if (controller.abortController) {
        controller.abortController.abort();
      }
      abortControllers.current.delete(id);
    }

    setUploads(prev => {
      const newUploads = new Map(prev);
      newUploads.set(id, { 
        ...newUploads.get(id), 
        status: 'cancelled' 
      });
      return newUploads;
    });
  }, []);

  // Удалить загрузку из списка
  const removeUpload = useCallback((id) => {
    setUploads(prev => {
      const newUploads = new Map(prev);
      newUploads.delete(id);
      return newUploads;
    });
    abortControllers.current.delete(id);
  }, []);

  // Получить загрузку по ID
  const getUpload = useCallback((id) => {
    return uploads.get(id);
  }, [uploads]);

  // Получить все загрузки
  const getAllUploads = useCallback(() => {
    return Array.from(uploads.values());
  }, [uploads]);

  // Получить активные загрузки
  const getActiveUploads = useCallback(() => {
    return Array.from(uploads.values()).filter(upload => 
      upload.status === 'uploading' || upload.status === 'paused'
    );
  }, [uploads]);

  return {
    uploads: Array.from(uploads.values()),
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    removeUpload,
    getUpload,
    getAllUploads,
    getActiveUploads
  };
} 