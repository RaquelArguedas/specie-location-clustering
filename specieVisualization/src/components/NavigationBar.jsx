import '../styles/NavigationBar.css';
import React from 'react';
import { useNavigate } from "react-router-dom";

const NavigationBar = () => {
  const navigate = useNavigate();

  return (
    <div className='navbar-container'> 
      <p className='navbar-title'>Biodiversity dataset</p>
      <div className='navbar-buttons'>
        <button onClick={() => navigate("/")}>
          Species
        </button>
        <button onClick={() => navigate("/regions")}>
          Species & regions
        </button>
      </div>
    </div>
  );
}
export default NavigationBar;
