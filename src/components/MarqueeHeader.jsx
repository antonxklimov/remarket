import React from 'react';

const MarqueeHeader = () => {
  const text = "3 августа 2025, двор бара «стрелка», берсеневская набережная, 14/5";
  
  return (
    <div className="marquee-header">
      <div className="marquee-content">
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
        <span className="marquee-text">{text}</span>
      </div>
    </div>
  );
};

export default React.memo(MarqueeHeader); 