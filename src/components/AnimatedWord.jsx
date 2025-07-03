import React, { useState, useEffect } from 'react';

const AnimatedWord = ({ words = ['Пятый', 'Юбилейный', 'Классный', 'Модный'], className = '', style = {} }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Начинаем блюр
      setIsBlurred(true);
      
      // Через 300ms меняем слово
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        
        // Через еще 100ms убираем блюр
        setTimeout(() => {
          setIsBlurred(false);
        }, 100);
      }, 300);
    }, 3000); // Меняем слово каждые 3 секунды

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span 
      className={`animated-word ${className}`}
      style={{
        ...style,
        transition: 'filter 0.3s ease-in-out',
        filter: isBlurred ? 'blur(5px)' : 'blur(0px)',
      }}
    >
      {words[currentIndex]}
    </span>
  );
};

export default AnimatedWord; 