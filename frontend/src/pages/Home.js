import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="gocast-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="gocast-container">
          <div className="hero-content">
            <h1 className="hero-title">
              La plataforma de castings <br />
              <span className="hero-gradient">que conecta talentos</span>
            </h1>
            <p className="hero-subtitle">
              Simplificamos el proceso de casting en Latinoamérica. <br />
              Conectamos talentos con productoras, agencias y marcas de manera profesional.
            </p>
            <div className="hero-buttons">
              <Link to="/registro" className="btn-primary" data-testid="hero-register-btn">
                Comenzar Gratis
              </Link>
              <Link to="/quienes-somos" className="btn-secondary" data-testid="hero-about-btn">
                Conocer Más
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="gocast-container">
          <h2 className="section-title">¿Por qué GOCAST.me?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎭</div>
              <h3 className="feature-title">Para Talentos</h3>
              <p className="feature-text">
                Crea tu perfil, sube tu portfolio y recibe invitaciones a castings que se ajustan a tu perfil.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3 className="feature-title">Para Productoras</h3>
              <p className="feature-text">
                Encuentra el talento perfecto, filtra por criterios específicos y gestiona castings de forma eficiente.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Rápido y Profesional</h3>
              <p className="feature-text">
                Sin fricciones. Proceso transparente, directo y accesible para proyectos grandes e independientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="gocast-container">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para comenzar?</h2>
            <p className="cta-text">
              Únete a GOCAST.me hoy y empieza a conectar con las mejores oportunidades.
            </p>
            <Link to="/registro" className="btn-primary-large" data-testid="cta-register-btn">
              Crear Cuenta Gratis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;