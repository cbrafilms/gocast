import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="gocast-footer">
      <div className="gocast-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">GOCAST.me</h3>
            <p className="footer-text">
              La plataforma que conecta talentos con productoras audiovisuales en Latinoamérica.
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Enlaces</h4>
            <div className="footer-links">
              <Link to="/quienes-somos" className="footer-link">Quiénes Somos</Link>
              <Link to="/faq" className="footer-link">Preguntas Frecuentes</Link>
              <Link to="/precios" className="footer-link">Precios</Link>
              <Link to="/legales" className="footer-link">Legales</Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-subtitle">Contacto</h4>
            <p className="footer-text">info@gocast.me</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2025 GOCAST.me. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;