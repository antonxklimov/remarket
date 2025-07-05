import React from 'react';

export default function UploadProgress({ upload, onPause, onResume, onCancel, onRemove }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м ${seconds % 60}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'paused': return 'text-yellow-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидание';
      case 'uploading': return 'Загрузка';
      case 'paused': return 'Приостановлено';
      case 'completed': return 'Завершено';
      case 'error': return 'Ошибка';
      case 'cancelled': return 'Отменено';
      default: return 'Неизвестно';
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'uploading': return 'bg-blue-600';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
              {upload.file.name}
            </div>
            <div className="text-xs text-gray-500">
              {formatFileSize(upload.file.size)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getStatusColor(upload.status)}`}>
            {getStatusText(upload.status)}
          </span>
          
          {upload.status === 'uploading' && (
            <button
              onClick={() => onPause(upload.id)}
              className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors"
              title="Приостановить"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {upload.status === 'paused' && (
            <button
              onClick={() => onResume(upload.id)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Возобновить"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {(upload.status === 'uploading' || upload.status === 'paused') && (
            <button
              onClick={() => onCancel(upload.id)}
              className="p-1 text-red-600 hover:text-red-800 transition-colors"
              title="Отменить"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {(upload.status === 'completed' || upload.status === 'error' || upload.status === 'cancelled') && (
            <button
              onClick={() => onRemove(upload.id)}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
              title="Удалить"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(upload.status)}`}
          style={{ width: `${upload.progress}%` }}
        />
      </div>

      {/* Progress Info */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{upload.progress}%</span>
        
        {upload.status === 'uploading' && upload.startTime && (
          <span>
            {formatTime(Date.now() - upload.startTime - upload.totalPausedTime)}
          </span>
        )}
        
        {upload.status === 'paused' && upload.pauseTime && (
          <span>
            Приостановлено на {formatTime(Date.now() - upload.pauseTime)}
          </span>
        )}
        
        {upload.status === 'completed' && (
          <span className="text-green-600">✓ Загружено</span>
        )}
        
        {upload.status === 'error' && (
          <span className="text-red-600">✗ {upload.error}</span>
        )}
        
        {upload.status === 'cancelled' && (
          <span className="text-gray-600">Отменено</span>
        )}
      </div>

      {/* Preview for completed uploads */}
      {upload.status === 'completed' && upload.url && (
        <div className="mt-3">
          <img 
            src={upload.url} 
            alt="Preview" 
            className="w-16 h-16 object-cover rounded border"
          />
        </div>
      )}
    </div>
  );
} 