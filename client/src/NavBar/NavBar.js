import React from 'react';
import './NavBar.css';

function NavBar(props) {
  return (
    <div className="navbar">
      <img className='mask' alt='mask' src='https://uploads.guim.co.uk/2020/05/19/mask.png'></img> <div>MaskMeter</div> 
    </div>
  );
}

export default NavBar;