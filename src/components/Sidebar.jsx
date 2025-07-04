import React, { useState, useEffect } from 'react';
import Logo from '../images/Logo.svg';

const Sidebar = ({ onMenuClick, sections }) => {
  // Sidebar теперь только для десктопа
  // fallback для старого меню
  const menuSections = sections && sections.length
    ? sections
    : [
        { id: 'hero', title: 'RE→MARKET' },
        { id: 'praese-vita', title: 'Локация' },
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
        <img src={Logo} alt="RE→MARKET logo" style={{height: 66, width: 'auto', display: 'block'}} />
      </div>
      <ul className="sidebar__nav">
        {menuSections.map((s, index) => (
          <li key={s.id}>
            <a href={`#${s.id}`} style={{textDecoration: 'none', color: 'inherit', cursor: 'pointer'}} onClick={e => onMenuClick && onMenuClick(e, s.id)}>
              {s.id === 'hero' ? 'о маркете' : s.title.toLowerCase()}
            </a>
          </li>
        ))}
      </ul>
      <div className="sidebar__links">
        <a href="mailto:re.market.re@yandex.ru">подать заявку →</a><br />
        <a href="https://www.instagram.com/re____market/" target="_blank" rel="noopener noreferrer">instagram</a><br />
        <a href="https://t.me/remarket24" target="_blank" rel="noopener noreferrer">telegram</a>
      </div>
      <div className="sidebar__copyright">
        ©{new Date().getFullYear()}
      </div>
    </aside>
  );
};

export default Sidebar; 