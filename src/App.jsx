import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import AnimatedWord from './components/AnimatedWord'
import MarqueeHeader from './components/MarqueeHeader'
import AdminPanel from './components/AdminPanel'
import LoginForm from './components/LoginForm'
import './App.css'
import { defaultSections } from './sectionsData'
import SimpleGallery from './components/SimpleGallery'
import { useAuth } from './hooks/useAuth'
import AnimatedSection from './components/AnimatedSection'

const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isDev ? 'https://remarket.cc/api' : '/api';

function scrollToSection(e, id) {
  e.preventDefault();
  const mainContent = document.querySelector('.main-content');
  const target = document.getElementById(id);
  const header = document.querySelector('.marquee-header');
  const offset = 45; // фиксированное смещение

  if (mainContent && target) {
    // Сбрасываем текущий скролл для правильного расчета
    const currentScrollTop = mainContent.scrollTop;
    
    // Получаем позицию элемента относительно его родителя
    const targetRect = target.getBoundingClientRect();
    const mainContentRect = mainContent.getBoundingClientRect();
    
    // Вычисляем истинную позицию с учетом текущего скролла и offset
    const targetPosition = targetRect.top - mainContentRect.top + currentScrollTop - offset;
    
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
  const [failedImages, setFailedImages] = useState(new Set());
  const dateRef = useRef();
  const firstSectionRef = useRef();
  // Новый breakpoint 560px
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 560);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  // Новое состояние для мобильного меню
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useLayoutEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 560);
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleImageError(src) {
    console.error('Ошибка загрузки изображения:', src);
    setFailedImages(prev => new Set([...prev, src]));
  }

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
        setScale(Math.min(1, available / 1200));
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
                  fontFamily: "Helvetica Neue",
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
      <>
        {/* Скрываем бегущую строку при открытом меню на мобильных */}
        {!(windowWidth <= 900 && mobileMenuOpen) && <MarqueeHeader />}
        <div className="layout" style={{ marginTop: '40px' }}>
          <Sidebar onMenuClick={scrollToSection} sections={visibleSections} />
        

        
        <main className="main-content">
          <div
            className="main-content-inner"
            style={{
              width: 1200,
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
              
              // Все секции имеют одинаковую высоту изображения как у hero-секции
              const imageHeight = 600;
              
              return (
                <AnimatedSection
                  key={section.id}
                  animation={i === 0 ? 'fadeInUp' : 'fadeInUp'}
                  delay={i * 200}
                  duration={800}
                >
                  <section
                    id={section.id}
                    ref={i === 0 ? firstSectionRef : undefined}
                    className="fullscreen-section"
                    style={{
                      height: 'auto', // Автоматическая высота для всех секций
                      minHeight: 'auto', // Убираем минимальную высоту для всех секций
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
                          fontFamily: "Helvetica Neue",
                          textTransform: 'uppercase',
                          lineHeight: '0.9'
                        }}
                      >
                        <AnimatedWord /><br />фестиваль локальных брендов <span style={{fontStyle: 'italic'}}>RE→MARKET</span>
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
                        fontFamily: "Helvetica Neue"
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
                      width: '100%',
                      flex: 'none', // Фиксированный размер для всех секций
                      ...(windowWidth <= 900 ? { aspectRatio: '1 / 1' } : { height: `${imageHeight}px` })
                    }}>
                    {section.galleryEnabled && section.gallery && section.gallery.length > 0 ? (
                      <SimpleGallery images={section.gallery} height={imageHeight} />
                    ) : section.image && section.image.trim() !== '' ? (
                      failedImages.has(section.image) ? (
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
                          fontFamily: "Helvetica Neue"
                        }}>
                          Изображение недоступно
                        </div>
                      ) : (
                        <img 
                          src={section.image} 
                          alt="section" 
                          style={{
                            width: '100%', 
                            height: '100%',
                            objectFit: windowWidth <= 900 ? 'contain' : 'cover',
                            borderRadius: 8
                          }}
                          loading="lazy"
                          onError={() => handleImageError(section.image)}
                        />
                      )
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
                          fontFamily: "Helvetica Neue"
                        }}>
                        Изображение
                      </div>
                    )}
                  </div>
                  
                  {/* Унифицированный блок дополнительного текста */}
                  <div
                    className="section-description"
                    dangerouslySetInnerHTML={{ __html: section.text }}
                  />
                  </section>
                </AnimatedSection>
              );
            })}
          </div>
        </main>
      </div>
      </>
    );
  }

  // Планшет и мобильная версия: sidebar скрыт
  return (
    <>
      {/* Скрываем бегущую строку при открытом меню на мобильных */}
      {!(windowWidth <= 900 && mobileMenuOpen) && <MarqueeHeader />}
      <main className="main-content" style={{ marginTop: 0 }}>
        <Header 
          sections={visibleSections} 
          onMenuClick={(e, id) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            setTimeout(() => {
              const section = document.getElementById(id);
              let target = null;
              if (section) {
                // Ищем заголовок внутри секции
                target = section.querySelector('h1, .section-title, .hero-title');
              }
              if (!target && section) target = section;
              if (target) {
                const headerOffset = 80; // высота бегущей строки + меню
                const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              } else {
                // Fallback: scroll window
                const y = section ? section.getBoundingClientRect().top + window.scrollY - 24 : 0;
                window.scrollTo({ top: y, behavior: 'smooth' });
                console.log('window.scrollTo fallback for', id);
              }
            }, 350); // чуть больше времени, чтобы меню успело скрыться
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
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
          const imageHeight = 600; // Унифицированная высота для всех секций как у hero
          const textSize = 1.8; // Увеличено для лучшей читаемости на мобильных
          
          return (
            <AnimatedSection
              key={section.id}
              animation={i === 0 ? 'fadeInUp' : 'fadeInUp'}
              delay={i * 150}
              duration={600}
            >
              <section
                id={section.id}
                ref={i === 0 ? firstSectionRef : undefined}
                style={{
                  marginBottom: '40px',
                  padding: `${i === 0 ? '40px' : '40px'} 0 16px 0`
                }}>
            {i === 0 ? (
              // Специальная структура для первой секции на мобильных
              <div style={{ width: '100%', marginBottom: 24, boxSizing: 'border-box' }}>
                <h1 
                  className="hero-title"
                  style={{
                    marginBottom: '16px',
                    color: '#000',
                    fontFamily: "Helvetica Neue",
                    textTransform: 'uppercase',
                    lineHeight: '0.9'
                  }}
                >
                  <AnimatedWord /><br />фестиваль локальных брендов <span style={{fontStyle: 'italic'}}>RE→MARKET</span>
                </h1>
              </div>
            ) : (
              // Обычная структура для остальных секций
              <div style={{ position: 'relative', width: '100%', maxWidth: '100%', marginBottom: 24, boxSizing: 'border-box' }}>
                <h1 className="section-title" style={{
                  fontSize: '2.5rem', 
                  marginBottom: '24px',
                  color: '#000',
                  fontFamily: "Helvetica Neue"
                }}>{section.title}</h1>
              </div>
            )}
            <div style={{
              width: '100%',
              marginBottom: '16px',
              ...(windowWidth <= 900 ? { aspectRatio: '1 / 1' } : { height: `${imageHeight}px` })
            }}>
              {section.galleryEnabled && section.gallery && section.gallery.length > 0 ? (
                <SimpleGallery images={section.gallery} height={imageHeight} />
              ) : section.image && section.image.trim() !== '' ? (
                failedImages.has(section.image) ? (
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
                    fontFamily: "Helvetica Neue"
                  }}>
                    Изображение недоступно
                  </div>
                ) : (
                  <img 
                    src={section.image} 
                    alt="section" 
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: windowWidth <= 900 ? 'contain' : 'cover',
                      borderRadius: 8
                    }}
                    loading="lazy"
                    onError={() => handleImageError(section.image)}
                  />
                )
              ) : (
                <div style={{width: '100%', height: '100%', background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '1.2rem', fontFamily: "Helvetica Neue"}}>
                  Изображение
                </div>
              )}
            </div>
            <div
              className="section-description"
              dangerouslySetInnerHTML={{ __html: section.text }}
            />
            <hr style={{margin: '16px 0'}} />
            </section>
          </AnimatedSection>
          );
        })}

      </div>
    </main>
    </>
  );
}

export default App
