import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

export default function SwiperGallery({ images, height = 533 }) {
  const [isBlurring, setIsBlurring] = useState(false);
  const [failedImages, setFailedImages] = useState(new Set());
  const blurTimeout = useRef();

  function handleTransitionStart() {
    setIsBlurring(true);
    clearTimeout(blurTimeout.current);
    blurTimeout.current = setTimeout(() => setIsBlurring(false), 400);
  }

  function handleImageError(src) {
    console.error('Ошибка загрузки изображения в галерее:', src);
    setFailedImages(prev => new Set([...prev, src]));
  }

  return (
    <div style={{ width: '100%', height: height, marginBottom: 0, borderRadius: 8, overflow: 'hidden' }}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        slidesPerView={1}
        loop={true}
        effect="fade"
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        speed={900}
        onTransitionStart={handleTransitionStart}
        style={{ width: '100%', height: '100%', borderRadius: 8 }}
      >
        {images.map((src, i) => (
          <SwiperSlide key={i}>
            {failedImages.has(src) ? (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#f5f5f5',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '1.2rem',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
              }}>
                Изображение недоступно
              </div>
            ) : (
              <img
                src={src}
                alt="gallery"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                  filter: isBlurring ? 'blur(12px)' : 'none',
                  transition: 'filter 0.38s cubic-bezier(.4,0,.2,1)'
                }}
                onError={() => handleImageError(src)}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
} 