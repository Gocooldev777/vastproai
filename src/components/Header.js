import React, { useContext } from 'react';
import { FiMenu, FiHome, FiPieChart, FiSun, FiMoon, FiUser } from 'react-icons/fi';
import ThemeContext from './ThemeContext';
import './Header.css';

function Header() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  return (
    <header className="header">
      <div className="header-logo">
        <img src="/vastpro-logo.jpg" alt="VAST Pro Logo" />
        <h1>Cane & Weather Analytics</h1>
      </div>
      
      <div className="header-nav">
        <button className="header-nav-item">
          <FiHome />
          <span>Dashboard</span>
        </button>
        <button className="header-nav-item">
          <FiPieChart />
          <span>Reports</span>
        </button>
        
        <button 
          className="theme-toggle" 
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
        
        <div className="user-profile">
          <FiUser />
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}

export default Header; 