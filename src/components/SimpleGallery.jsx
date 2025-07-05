import { useState, useEffect, useRef, useCallback } from 'react';

export default function SimpleGallery({ images, height = 533 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());
  const autoplayRef = useRef();
  const containerRef = useRef();

  // Функция для перехода к следующему изображению
  const nextImage = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [isTransitioning, images.length]);

  // Автоплей
  useEffect(() => {
    if (images.length <= 1) return;
    
    const startAutoplay = () => {
      autoplayRef.current = setInterval(() => {
        nextImage();
      }, 2500);
    };

    startAutoplay();
    return () => clearInterval(autoplayRef.current);
  }, [images.length, nextImage]);

  // Функция для перехода к предыдущему изображению
  const prevImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  // Переход к конкретному изображению
  const goToImage = (index) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  // Обработка ошибок загрузки изображений
  const handleImageError = (src) => {
    console.error('Ошибка загрузки изображения в галерее:', src);
    setFailedImages(prev => new Set([...prev, src]));
  };

  // Остановка автоплея при взаимодействии
  const pauseAutoplay = () => {
    clearInterval(autoplayRef.current);
  };

  const resumeAutoplay = () => {
    if (images.length > 1) {
      autoplayRef.current = setInterval(() => {
        nextImage();
      }, 2500);
    }
  };

  // Touch события для свайпов
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    pauseAutoplay();
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
    
    setTimeout(resumeAutoplay, 1000);
  };

  if (!images || images.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: height,
        background: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '1.2rem',
                    fontFamily: "Helvetica Neue"
      }}>
        Нет изображений
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: height,
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#f5f5f5'
      }}
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Изображения */}
      {images.map((src, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: index === currentIndex ? 1 : 0
          }}
        >
          {failedImages.has(src) ? (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '1.2rem',
              fontFamily: "Helvetica Neue"
            }}>
              Изображение недоступно
            </div>
          ) : (
            <img
              src={src}
              alt={`Gallery image ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 8
              }}
              onError={() => handleImageError(src)}
            />
          )}
        </div>
      ))}

      {/* Стрелки навигации (только если больше одного изображения) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#333',
              zIndex: 2,
              transition: 'all 0.2s',
              opacity: 0.7
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            ←
          </button>
          
          <button
            onClick={nextImage}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#333',
              zIndex: 2,
              transition: 'all 0.2s',
              opacity: 0.7
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            →
          </button>
        </>
      )}

      {/* Точки-индикаторы внизу (только если больше одного изображения) */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 2
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                background: index === currentIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
} 