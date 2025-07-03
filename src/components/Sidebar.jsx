import React, { useState, useEffect } from 'react';
import Logo from '../images/Logo.svg';

const Sidebar = ({ onMenuClick, sections }) => {
  // Sidebar теперь только для десктопа
  // fallback для старого меню
  const menuSections = sections && sections.length
    ? sections
    : [
        { id: 'praese-vita', title: 'Praese Vita' },
        { id: 'nulla-vehicu-al', title: 'Nulla Vehicu Al' },
        { id: 'ukam-cors', title: 'Ukam Cors' },
        { id: 'dictum-magna', title: 'Dictum Magna' },
        { id: 'cursus-ex', title: 'Cursus Ex' },
        { id: 'suspendis-est', title: 'Suspendis Est' },
        { id: 'facili-sap', title: 'Facili Sap' },
        { id: 'et-magni-disc', title: 'Et Magni Disc' },
        { id: 'phasellus-deus', title: 'Phasellus Deus' },
      ];

  return (
    <aside className="sidebar" style={{borderRight: 'none'}}>
      <div className="sidebar__title">
        <img src={Logo} alt="RE→MARKET logo" style={{height: 44, width: 'auto', display: 'block'}} />
      </div>
      <ol className="sidebar__nav">
        {menuSections.map((s, index) => (
          <li key={s.id}>
            <a href={`#${s.id}`} style={{textDecoration: 'none', color: 'inherit', cursor: 'pointer'}} onClick={e => onMenuClick && onMenuClick(e, s.id)}>
              {index === 0 ? 'О маркете' : s.title}
            </a>
          </li>
        ))}
      </ol>
      <div className="sidebar__links">
        <a href="mailto:re.market.re@yandex.ru">Подать заявку →</a><br />
        <a href="https://www.instagram.com/re____market/" target="_blank" rel="noopener noreferrer">Instagram</a><br />
        <a href="https://t.me/remarket24" target="_blank" rel="noopener noreferrer">Telegram</a>
      </div>
      <div className="sidebar__copyright">
        ©{new Date().getFullYear()} <a href="https://inoutstud.io/" target="_blank" rel="noopener noreferrer" className="sidebar__studio-link">in—out studio</a>
      </div>
    </aside>
  );
};

export default Sidebar; 