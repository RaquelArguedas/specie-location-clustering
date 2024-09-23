import React, { useState } from 'react';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';

const Carrusel = ({ images }) => {
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="gallery-container">
      <img src={images[currentIndex]}/>
      <div className="gallery-buttons">
        <button onClick={prevSlide}>
          <GoChevronLeft size={20}/>
        </button>
        <button onClick={nextSlide} >
          <GoChevronRight size={20}/>
        </button>
      </div>
    </div>
  );
};

export default Carrusel;
