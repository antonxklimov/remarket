import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import AnimatedWord from './components/AnimatedWord'
import './App.css'
import { defaultSections } from './sectionsData'
import SwiperGallery from './components/SwiperGallery'

const API_BASE_URL = '/api';

function scrollToSection(e, id) {
  e.preventDefault();
  const mainContent = document.querySelector('.main-content');
  const target = document.getElementById(id);
  
  if (mainContent && target) {
    // Сбрасываем текущий скролл для правильного расчета
    const currentScrollTop = mainContent.scrollTop;
    
    // Получаем позицию элемента относительно его родителя
    const targetRect = target.getBoundingClientRect();
    const mainContentRect = mainContent.getBoundingClientRect();
    
    // Вычисляем истинную позицию с учетом текущего скролла
    const targetPosition = targetRect.top - mainContentRect.top + currentScrollTop;
    
    console.log('Scrolling to:', id, 'targetPosition:', targetPosition);
    mainContent.scrollTo({ 
      top: targetPosition, 
      behavior: 'smooth' 
    });
  }
}

function App() {
  const [sections, setSections] = useState(defaultSections);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const dateRef = useRef();
  const firstSectionRef = useRef();
  // Новый breakpoint 560px
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 560);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useLayoutEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 560);
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'RE→MARKET / 2025';
    return () => { document.title = prevTitle; };
  }, []);

  // Загрузка данных с API
  useEffect(() => {
    async function loadSections() {
      try {
        const response = await fetch(`${API_BASE_URL}/data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSections(data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Используем localStorage как fallback
        const saved = localStorage.getItem('sections');
        if (saved) {
          setSections(JSON.parse(saved));
        }
        // Если ни API, ни localStorage не работают, используем defaultSections
      } finally {
        setLoading(false);
      }
    }
    
    loadSections();
  }, []);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w > 900) {
        const available = w - 400;
        setScale(Math.min(1, available / 1400));
      } else {
        setScale(1);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem('sections');
      setSections(saved ? JSON.parse(saved) : defaultSections);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (!dateRef.current || !firstSectionRef.current) return;
      dateRef.current.style.filter = 'none';
      dateRef.current.style.pointerEvents = 'auto';
    }
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => mainContent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Показываем индикатор загрузки
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontFamily: 'Helvetica Neue',
        color: '#111',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>Загрузка...</div>
          <div style={{ fontSize: 16, color: '#666' }}>RE→MARKET 2025</div>
        </div>
      </div>
    );
  }

  // Только не скрытые секции
  const visibleSections = sections.filter(s => !s.hidden);
  if (windowWidth > 900) {
    // Десктоп: sidebar виден, main-content со scale
    return (
      <div className="layout">
        <Sidebar onMenuClick={scrollToSection} sections={visibleSections} />
        
        {/* Фиксированная дата в верхней правой части экрана */}
        <div className="fixed-date-desktop" style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top right'
        }}>
          → 3 августа 2025<br />
          <span className="date-arrow">стрелка</span>
        </div>
        
        <main className="main-content">
          <div
            className="main-content-inner"
            style={{
              width: 1400,
              transform: `scale(${scale})`,
              transformOrigin: 'left top',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minHeight: `${100 / scale}vh`,
              justifyContent: 'flex-start',
            }}
          >
            {/* Все секции как fullscreen, включая первую (бывшая hero) */}
            {visibleSections.map((section, i) => {
              const availableHeight = (100 / scale) * (window.innerHeight / 100);
              
              // Правильный расчет размеров для каждой секции
              const headerHeight = i === 0 ? 150 : 100; // Заголовок и дата вертикально для первой секции (уменьшен для 8rem)
              const textHeight = 140; // Увеличено для более крупного текста
              const margins = 48; // Одинаковые отступы для всех секций
              
              // Для hero-секции используем фиксированный большой размер изображения
              const imageHeight = i === 0 
                ? 600 // Фиксированно 600px для hero-секции - это должно сделать секцию выше экрана
                : Math.max(200, availableHeight - headerHeight - textHeight - margins);
              
              return (
                <section
                  id={section.id}
                  key={section.id}
                  ref={i === 0 ? firstSectionRef : undefined}
                  className="fullscreen-section"
                  style={{
                    height: i === 0 ? 'auto' : `${100 / scale}vh`, // Автоматическая высота для hero-секции
                    minHeight: i === 0 ? 'auto' : `${100 / scale}vh`, // Убираем минимальную высоту для hero-секции
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start'
                  }}>
                  {i === 0 ? (
                    // Специальная структура для первой секции - заголовок и дата вертикально
                    <div style={{ 
                      width: '100%',
                      marginBottom: '32px',
                      flexShrink: 0
                    }}>
                      <h1 
                        className="hero-title"
                        style={{
                          margin: 0,
                          marginBottom: '16px',
                          textAlign: 'left',
                          color: '#000',
                          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                        }}
                      >
                        <AnimatedWord /><br />фестиваль локальных брендов RE→MARKET
                      </h1>
                    </div>
                  ) : (
                    // Header для остальных секций
                    <div style={{ 
                      position: 'relative', 
                      width: '100%', 
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      height: `${headerHeight}px`,
                      flexShrink: 0
                    }}>
                      <h1 className="section-title" style={{
                        fontSize: '3.5rem',
                        margin: 0, 
                        flex: 1,
                        color: '#000',
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                      }}>{section.title}</h1>
                    </div>
                  )}
                  
                  {/* Основной контент - изображение занимает оставшееся пространство */}
                  <div 
                    className="section-image-container"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      height: `${imageHeight}px`,
                      width: '100%',
                      flex: i === 0 ? 'none' : 1 // Убираем flex: 1 для hero-секции
                    }}>
                    {section.galleryEnabled && section.gallery && section.gallery.length > 0 ? (
                      <SwiperGallery images={section.gallery} height={imageHeight} />
                    ) : section.image && section.image.trim() !== '' ? (
                      <img src={section.image} alt="section" style={{
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover', 
                        borderRadius: 8
                      }} />
                    ) : (
                      <div 
                        className="section-image-placeholder"
                        style={{
                          width: '100%', 
                          height: '100%', 
                          background: '#f5f5f5', 
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: '1.2rem',
                          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                        }}>
                        Изображение
                      </div>
                    )}
                  </div>
                  
                  {/* Текст - без скролла, адаптивная высота */}
                  <div
                    style={{
                      fontSize: '2.0rem', 
                      color: '#000', 
                      lineHeight: 1.5,
                      minHeight: `${Math.min(textHeight, 120)}px`,
                      maxHeight: `${textHeight}px`,
                      overflow: 'hidden',
                      padding: '16px 0',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                    }}
                    dangerouslySetInnerHTML={{ __html: section.text }}
                  />
                </section>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Планшет и мобильная версия: sidebar скрыт
  return (
    <main className="main-content">
      <Header sections={visibleSections} onMenuClick={scrollToSection} />
      <div
        className="main-content-inner"
        style={
          windowWidth <= 600
            ? {
                transform: undefined,
                margin: '0 auto',
                width: '100%',
                maxWidth: 480,
                padding: '16px 16px 16px 16px',
                boxSizing: 'border-box',
                justifyContent: 'center',
                alignItems: 'center',
              }
            : {
                transform: undefined,
                margin: '0 auto',
                width: '100%',
                maxWidth: 900,
                padding: '16px 16px 16px 16px',
                boxSizing: 'border-box',
                justifyContent: 'center',
                alignItems: 'center',
              }
        }
      >
        {/* Контент секций */}
        {visibleSections.map((section, i) => {
          // Простые размеры для мобильных
          const imageHeight = windowWidth <= 600 ? 600 : 350;
          const textSize = 1.8; // Увеличено для лучшей читаемости на мобильных
          
          return (
          <section
            id={section.id}
            key={section.id}
            ref={i === 0 ? firstSectionRef : undefined}
            style={{
              marginBottom: '40px',
              padding: `${i === 0 ? '0' : '40px'} 0 16px 0`
            }}>
            {i === 0 ? (
              // Специальная структура для первой секции на мобильных
              <div style={{ width: '100%', marginBottom: 24, boxSizing: 'border-box' }}>
                <h1 
                  className="hero-title"
                  style={{
                    marginBottom: '16px',
                    color: '#000',
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                  }}
                >
                  <AnimatedWord /><br />фестиваль локальных брендов RE→MARKET
                </h1>
              </div>
            ) : (
              // Обычная структура для остальных секций
              <div style={{ position: 'relative', width: '100%', maxWidth: '100%', marginBottom: 24, boxSizing: 'border-box' }}>
                <h1 className="section-title" style={{
                  fontSize: '2.5rem', 
                  marginBottom: '24px',
                  color: '#000',
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                }}>{section.title}</h1>
              </div>
            )}
            <div style={{ 
              height: `${imageHeight}px`,
              width: '100%',
              marginBottom: '16px'
            }}>
              {section.galleryEnabled && section.gallery && section.gallery.length > 0 ? (
                <SwiperGallery images={section.gallery} height={imageHeight} />
              ) : section.image && section.image.trim() !== '' ? (
                <img src={section.image} alt="section" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8}} />
              ) : (
                <div style={{width: '100%', height: '100%', background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '1.2rem', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'}}>
                  Изображение
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: `${textSize}rem`, 
                color: '#000', 
                marginBottom: '16px', 
                height: 'auto', // Автоматическая высота для мобильных
                overflow: 'visible', // Убираем скролл для мобильных
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
              }}
              dangerouslySetInnerHTML={{ __html: section.text }}
            />
            <hr style={{margin: '16px 0'}} />
          </section>
          );
        })}

      </div>
    </main>
  );
}

export default App
