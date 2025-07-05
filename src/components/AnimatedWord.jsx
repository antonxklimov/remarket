import React from 'react';

const AnimatedWord = ({ className = '', style = {} }) => {
  return (
    <span 
      className={`animated-word ${className}`}
      style={{
        ...style,
        display: 'inline-block',
      }}
    >
      пятый юбилейный
    </span>
  );
};

export default AnimatedWord; 