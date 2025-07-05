import React, { useState } from 'react';
import { useUploadManager } from '../hooks/useUploadManager';
import UploadProgress from './UploadProgress';

export default function UploadManager({ onUploadComplete }) {
  const {
    uploads,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    removeUpload,
    getActiveUploads
  } = useUploadManager();

  const [isOpen, setIsOpen] = useState(false);
  const [authHeaders, setAuthHeaders] = useState({});

  // Получаем заголовки авторизации из localStorage
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
  }, []);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const url = await startUpload(uploadId, file, authHeaders);
          if (url && onUploadComplete) {
            onUploadComplete(url);
          }
        } catch (error) {
          console.error('Ошибка загрузки:', error);
        }
      }
    }
    
    // Очищаем input
    event.target.value = '';
  };

  const activeUploads = getActiveUploads();
  const hasUploads = uploads.length > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Upload Button */}
      <div className="flex flex-col items-end space-y-2">
        {/* File Input */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        
        {/* Upload Button */}
        <label
          htmlFor="file-upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span>Загрузить изображения</span>
        </label>

        {/* Upload Manager Toggle */}
        {hasUploads && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              Загрузки ({activeUploads.length})
            </span>
          </button>
        )}
      </div>

      {/* Upload Progress Panel */}
      {isOpen && hasUploads && (
        <div className="absolute bottom-full right-0 mb-2 w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Управление загрузками
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Summary */}
            <div className="mt-2 text-sm text-gray-600">
              {activeUploads.length > 0 && (
                <span className="text-blue-600">
                  Активных: {activeUploads.length}
                </span>
              )}
              {uploads.filter(u => u.status === 'completed').length > 0 && (
                <span className="ml-3 text-green-600">
                  Завершено: {uploads.filter(u => u.status === 'completed').length}
                </span>
              )}
              {uploads.filter(u => u.status === 'error').length > 0 && (
                <span className="ml-3 text-red-600">
                  Ошибок: {uploads.filter(u => u.status === 'error').length}
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {uploads.map((upload) => (
              <UploadProgress
                key={upload.id}
                upload={upload}
                onPause={pauseUpload}
                onResume={resumeUpload}
                onCancel={cancelUpload}
                onRemove={removeUpload}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  uploads.forEach(upload => {
                    if (upload.status === 'uploading') {
                      pauseUpload(upload.id);
                    }
                  });
                }}
                disabled={!uploads.some(u => u.status === 'uploading')}
                className="px-3 py-1 text-sm bg-yellow-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition-colors"
              >
                Приостановить все
              </button>
              
              <button
                onClick={() => {
                  uploads.forEach(upload => {
                    if (upload.status === 'paused') {
                      resumeUpload(upload.id);
                    }
                  });
                }}
                disabled={!uploads.some(u => u.status === 'paused')}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Возобновить все
              </button>
              
              <button
                onClick={() => {
                  uploads.forEach(upload => {
                    if (upload.status === 'uploading' || upload.status === 'paused') {
                      cancelUpload(upload.id);
                    }
                  });
                }}
                disabled={!uploads.some(u => u.status === 'uploading' || u.status === 'paused')}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
              >
                Отменить все
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 