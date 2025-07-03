import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import './App.css'
import { defaultSections } from './sectionsData'
import SwiperGallery from './components/SwiperGallery'

const API_BASE_URL = '/api';

function scrollToSection(e, id) {
  e.preventDefault();
  const mainContent = document.querySelector('.main-content');
  const target = document.getElementById(id);
  
  if (mainContent && target) {
    // Для fullscreen секций просто скроллим к началу секции
    const offset = target.offsetTop;
    mainContent.scrollTo({ top: offset, behavior: 'smooth' });
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
              const headerHeight = section.largeTitle ? (i === 0 ? 160 : 220) : 100; // Больше места для первой секции
              const textHeight = 140; // Увеличено для более крупного текста
              const margins = i === 0 ? 64 : 48; // Больше отступов для первой секции
              
              const imageHeight = Math.max(200, availableHeight - headerHeight - textHeight - margins);
              
              return (
                <section
                  id={section.id}
                  key={section.id}
                  ref={i === 0 ? firstSectionRef : undefined}
                  className="fullscreen-section"
                  style={{
                    height: `${100 / scale}vh`,
                    minHeight: `${100 / scale}vh`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start'
                  }}>
                  {/* Header с заголовком и датой */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    marginBottom: i === 0 ? '32px' : '16px', // Больше отступ для первой секции
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    height: `${headerHeight}px`,
                    flexShrink: 0
                  }}>
                    {section.largeTitle ? (
                      // Большой заголовок (11rem или Hero для первой секции)
                      <h1 
                        className={i === 0 ? 'hero-title' : 'large-title'}
                        style={{
                          margin: 0,
                          textAlign: 'left',
                          color: 'rgba(0,0,0,0.9)',
                          fontFamily: '"Diatype Variable", "Helvetica Neue", Helvetica, Arial, sans-serif',
                          flex: 1
                        }}
                      >
                        {i === 0 ? 'Пятый фестиваль локальных брендов RE→MARKET' : section.title}
                      </h1>
                    ) : (
                      // Обычный заголовок секции
                      <h1 style={{
                        fontSize: '2.2rem',
                        margin: 0, 
                        flex: 1
                      }}>{section.title}</h1>
                    )}
                    {i === 0 && (
                      <div
                        ref={dateRef}
                        className="market-date"
                        style={{
                          fontWeight: 700,
                          fontSize: 22,
                          color: '#222',
                          background: 'none',
                          padding: 0,
                          borderRadius: 0,
                          zIndex: 2,
                          transition: 'opacity 0.3s, filter 0.3s',
                          pointerEvents: 'auto',
                          filter: 'none',
                          opacity: 1,
                          marginLeft: '24px',
                          flexShrink: 0
                        }}
                      >
                        → 3 августа 2025
                      </div>
                    )}
                  </div>
                  
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
                      flex: 1
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
                          color: '#999',
                          fontSize: '1.2rem'
                        }}>
                        Изображение
                      </div>
                    )}
                  </div>
                  
                  {/* Текст - компактная полоска внизу */}
                  <div
                    style={{
                      fontSize: '2.2rem', 
                      color: '#444', 
                      lineHeight: 1.5,
                      height: `${textHeight}px`,
                      overflow: 'auto',
                      padding: '16px 0',
                      boxSizing: 'border-box',
                      flexShrink: 0
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
          const imageHeight = windowWidth <= 600 ? 250 : 350;
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
            <div style={{ position: 'relative', width: '100%', maxWidth: '100%', marginBottom: 24, boxSizing: 'border-box' }}>
              {section.largeTitle ? (
                // Большой заголовок для мобильных
                <h1 
                  className={i === 0 ? 'hero-title' : 'large-title'}
                  style={{
                    marginBottom: i === 0 ? '32px' : '24px', // Больше отступ для первой секции
                    color: 'rgba(0,0,0,0.9)',
                    fontFamily: '"Diatype Variable", "Helvetica Neue", Helvetica, Arial, sans-serif'
                  }}
                >
                  {i === 0 ? 'Пятый фестиваль локальных брендов RE→MARKET' : section.title}
                </h1>
              ) : (
                // Обычный заголовок секции
                <h1 style={{fontSize: '2.2rem', marginBottom: '24px'}}>{section.title}</h1>
              )}
              {i === 0 && (
                <div
                  ref={dateRef}
                  className="market-date"
                  style={{
                    position: 'static', // Изменено с absolute на static
                    fontWeight: 700,
                    fontSize: 22,
                    color: '#222',
                    background: 'none',
                    padding: 0,
                    borderRadius: 0,
                    zIndex: 2,
                    transition: 'opacity 0.3s, filter 0.3s',
                    pointerEvents: 'auto',
                    filter: 'none',
                    opacity: 1,
                    marginBottom: '32px' // Больше отступ для первой секции
                  }}
                >
                  → 3 августа 2025
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
                  <div style={{width: '100%', height: '100%', background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '1.2rem'}}>
                    Изображение
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: `${textSize}rem`, 
                color: '#444', 
                marginBottom: '16px', 
                height: 'auto', // Автоматическая высота для мобильных
                overflow: 'visible' // Убираем скролл для мобильных
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
