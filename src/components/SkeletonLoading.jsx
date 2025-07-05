import React from 'react';

// Skeleton для секции
export const SectionSkeleton = () => (
  <div style={{
    width: '100%',
    height: '600px',
    background: '#f5f5f5',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: '16px'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
  </div>
);

// Skeleton для заголовка
export const TitleSkeleton = ({ height = '3rem', width = '60%' }) => (
  <div style={{
    width,
    height,
    background: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '16px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
  </div>
);

// Skeleton для текста
export const TextSkeleton = ({ lines = 3 }) => (
  <div>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          width: i === lines - 1 ? '80%' : '100%',
          height: '1.2rem',
          background: '#f0f0f0',
          borderRadius: '4px',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }} />
      </div>
    ))}
  </div>
);

// Skeleton для галереи
export const GallerySkeleton = ({ height = '533px' }) => (
  <div style={{
    width: '100%',
    height,
    background: '#f5f5f5',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
  </div>
);

// Skeleton для изображения
export const ImageSkeleton = ({ width = '100%', height = '100%' }) => (
  <div style={{
    width,
    height,
    background: '#f5f5f5',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite'
    }} />
  </div>
);

// CSS для анимации shimmer
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// Добавляем стили в head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerStyles;
  document.head.appendChild(style);
}

export default {
  SectionSkeleton,
  TitleSkeleton,
  TextSkeleton,
  GallerySkeleton,
  ImageSkeleton
}; 