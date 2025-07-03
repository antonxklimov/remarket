import React, { useState, useEffect } from 'react';
import Logo from '../images/Logo.svg';

const extraLinks = [
  { label: 'Подать заявку →', href: 'mailto:re.market.re@yandex.ru' },
  { label: 'Instagram', href: 'https://www.instagram.com/re____market/' },
  { label: 'Telegram', href: 'https://t.me/remarket24' },
];

const Header = ({ sections, onMenuClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleSections = sections ? sections.filter(s => !s.hidden) : [];

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    // Очистка при размонтировании компонента
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [mobileMenuOpen]);

  return (
    <header className="mobile-header">
      <div className="mobile-header__content mobile-header__content--space">
        <img src={Logo} alt="RE→MARKET logo" className="mobile-header__logo" />
        <button
          className="mobile-header__menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Открыть меню"
        >
          Меню
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header-minimal">
              <img src={Logo} alt="RE→MARKET logo" className="mobile-header__logo" />
              <button 
                className="mobile-menu-close-minimal"
                onClick={() => setMobileMenuOpen(false)} 
                aria-label="Закрыть меню"
              >
                ×
              </button>
            </div>
            <div className="mobile-menu-content">
              <ol className="mobile-menu-list-minimal">
                {visibleSections.map((s, idx) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={e => {
                        setMobileMenuOpen(false);
                        onMenuClick && onMenuClick(e, s.id);
                      }}
                    >
                      {idx === 0 ? 'О маркете' : s.title}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="mobile-menu-links-minimal">
                {extraLinks.map(link => (
                  <div key={link.label}>
                    <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{link.label}</a>
                  </div>
                ))}
              </div>
            </div>
            <div className="mobile-menu-copyright-minimal">
              ©{new Date().getFullYear()} <a href="https://inoutstud.io/" target="_blank" rel="noopener noreferrer" className="sidebar__studio-link">in—out studio</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 