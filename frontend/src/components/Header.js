import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="gocast-header">
      <div className="gocast-container">
        <div className="gocast-header-content">
          <Link to="/" className="gocast-logo">
            <span className="logo-text">GOCAST</span>
            <span className="logo-dot">.me</span>
          </Link>
          
          <nav className="gocast-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/quienes-somos" className="nav-link">Quiénes Somos</Link>
            <Link to="/faq" className="nav-link">FAQ</Link>
            <Link to="/precios" className="nav-link">Precios</Link>
            <Link to="/legales" className="nav-link">Legales</Link>
            <Link to="/registro" className="nav-link-button">Registro</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;