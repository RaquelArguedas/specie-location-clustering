import '../styles/NavigationBar.css';
import React from 'react';

function NavigationBar() {

  return (
    <div className='navbar-container'> 
      <p className='navbar-title'>Biodiversity dataset</p>
      <div className='navbar-buttons'>
        <button>
          Species
        </button>
        <button>
          Regions
        </button>
        <button>
          Species & regions
        </button>
      </div>
    </div>
  );
}
export default NavigationBar;
