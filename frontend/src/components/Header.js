import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { isAuthenticated, user } = useAuth();

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
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <span className="nav-user">👤 {user?.nombre}</span>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Iniciar Sesión</Link>
                <Link to="/registro" className="nav-link-button">Registro</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;