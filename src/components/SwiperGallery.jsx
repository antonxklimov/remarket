import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

export default function SwiperGallery({ images, height = 533 }) {
  const [isBlurring, setIsBlurring] = useState(false);
  const blurTimeout = useRef();

  function handleTransitionStart() {
    setIsBlurring(true);
    clearTimeout(blurTimeout.current);
    blurTimeout.current = setTimeout(() => setIsBlurring(false), 400);
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
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
} 