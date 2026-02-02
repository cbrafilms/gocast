import React from 'react';
import { Check } from 'lucide-react';

const Precios = () => {
  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="content-page">
          <h1 className="page-title" data-testid="pricing-title">Precios y Planes</h1>
          <p className="page-subtitle">Elige el plan que mejor se adapte a tus necesidades</p>
          
          {/* Sección Talentos */}
          <section className="pricing-section">
            <h2 className="pricing-section-title">Para Talentos</h2>
            <div className="pricing-grid-single">
              <div className="pricing-card pricing-card-talent" data-testid="talent-plan">
                <div className="pricing-header">
                  <h3 className="pricing-name">Plan Talento</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$12</span>
                    <span className="price-period">/año</span>
                  </div>
                  <p className="pricing-description">Primer año completamente gratis</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Perfil profesional completo</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Subida ilimitada de fotos y videos</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Recibe invitaciones a castings</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Panel de gestión personal</span>
                  </li>
                </ul>
                <button className="pricing-button" data-testid="talent-plan-btn">Comenzar Gratis</button>
              </div>
            </div>
          </section>

          {/* Sección Productoras */}
          <section className="pricing-section">
            <h2 className="pricing-section-title">Para Productoras y Agencias</h2>
            
            <div className="pricing-grid">
              {/* Pago por Casting */}
              <div className="pricing-card" data-testid="pay-per-casting-plan">
                <div className="pricing-badge">Ideal para empezar</div>
                <div className="pricing-header">
                  <h3 className="pricing-name">Pago por Casting</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$10</span>
                    <span className="price-period">/casting</span>
                  </div>
                  <p className="pricing-description">Navega gratis, paga solo al enviar invitaciones</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Crear perfil: Gratis</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Navegar talentos: Gratis</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Activar casting: $10</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Sin compromisos mensuales</span>
                  </li>
                </ul>
                <button className="pricing-button" data-testid="pay-per-casting-btn">Empezar Ahora</button>
              </div>

              {/* Suscripción Mensual Básica */}
              <div className="pricing-card" data-testid="monthly-basic-plan">
                <div className="pricing-header">
                  <h3 className="pricing-name">Mensual Básico</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$10</span>
                    <span className="price-period">/mes</span>
                  </div>
                  <p className="pricing-description">Hasta 5 castings por mes</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>5 castings incluidos</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Filtros avanzados</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Castings adicionales: $5 c/u</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Soporte prioritario</span>
                  </li>
                </ul>
                <button className="pricing-button" data-testid="monthly-basic-btn">Suscribirse</button>
              </div>

              {/* Suscripción Mensual Premium */}
              <div className="pricing-card pricing-card-featured" data-testid="monthly-premium-plan">
                <div className="pricing-badge pricing-badge-popular">Más Popular</div>
                <div className="pricing-header">
                  <h3 className="pricing-name">Mensual Premium</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$20</span>
                    <span className="price-period">/mes</span>
                  </div>
                  <p className="pricing-description">Castings ilimitados</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Castings ilimitados</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Filtros avanzados</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Destaca castings: $5 c/u</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Soporte prioritario 24/7</span>
                  </li>
                </ul>
                <button className="pricing-button pricing-button-featured" data-testid="monthly-premium-btn">Suscribirse</button>
              </div>

              {/* Plan Anual */}
              <div className="pricing-card" data-testid="annual-plan">
                <div className="pricing-badge pricing-badge-save">Ahorra 50%</div>
                <div className="pricing-header">
                  <h3 className="pricing-name">Plan Anual</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$50</span>
                    <span className="price-period">/año</span>
                  </div>
                  <p className="pricing-description">Hasta 60 castings al año</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>60 castings incluidos</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Ahorro de $70 al año</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Castings adicionales: $5 c/u</span>
                  </li>
                  <li className="feature-item">
                    <Check className="feature-icon" />
                    <span>Facturación anual</span>
                  </li>
                </ul>
                <button className="pricing-button" data-testid="annual-btn">Suscribirse</button>
              </div>
            </div>
          </section>

          {/* Sección Extras */}
          <section className="pricing-extras">
            <h2 className="pricing-section-title">Extras Disponibles</h2>
            <div className="extras-grid">
              <div className="extra-card">
                <h3 className="extra-title">Casting Destacado</h3>
                <p className="extra-description">Aparece en la parte superior durante 7 días</p>
                <div className="extra-price">$5</div>
              </div>
              <div className="extra-card">
                <h3 className="extra-title">Castings Adicionales</h3>
                <p className="extra-description">Para planes mensuales o anuales</p>
                <div className="extra-price">$5 c/u</div>
              </div>
            </div>
          </section>

          {/* Por qué funciona */}
          <section className="pricing-why">
            <h2 className="pricing-section-title">¿Por qué este modelo funciona?</h2>
            <div className="why-grid">
              <div className="why-item">
                <span className="why-icon">💰</span>
                <p>Económico para productoras pequeñas e independientes</p>
              </div>
              <div className="why-item">
                <span className="why-icon">🚀</span>
                <p>Escalable para agencias y productoras grandes</p>
              </div>
              <div className="why-item">
                <span className="why-icon">🎯</span>
                <p>Atrae talentos rápidamente con primer año gratis</p>
              </div>
              <div className="why-item">
                <span className="why-icon">🔄</span>
                <p>Ingresos recurrentes y compras impulsivas</p>
              </div>
              <div className="why-item">
                <span className="why-icon">🌎</span>
                <p>Competitivo frente a plataformas internacionales</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Precios;