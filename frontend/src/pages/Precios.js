import React from 'react';
import { Check } from 'lucide-react';

const Precios = () => {
  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="content-page">
          <h1 className="page-title" data-testid="pricing-title">Planes GOCAST.me</h1>
          <p className="page-subtitle">
            Precios simples para escalar talento y producción en Latinoamérica.
          </p>

          <section className="pricing-section">
            <h2 className="pricing-section-title">Talentos</h2>
            <div className="pricing-grid">
              <div className="pricing-card pricing-card-featured" data-testid="talent-free-plan">
                <div className="pricing-badge pricing-badge-popular">Free para siempre</div>
                <div className="pricing-header">
                  <h3 className="pricing-name">Free</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$0</span>
                    <span className="price-period">/siempre</span>
                  </div>
                  <p className="pricing-description">Ideal para empezar y postular rápido.</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item"><Check className="feature-icon" /><span>1 foto (subida directa)</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>1 video por URL (YouTube, Vimeo o Drive público)</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Postulación a castings</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Perfil público básico</span></li>
                </ul>
                <a className="pricing-helper-link" href="/faq#video-url">¿Cómo subir mi video por URL?</a>
                <button className="pricing-button" data-testid="talent-free-btn">Empezar Gratis</button>
              </div>

              <div className="pricing-card" data-testid="talent-pro-plan">
                <div className="pricing-header">
                  <h3 className="pricing-name">Talento Pro</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$12</span>
                    <span className="price-period">/año (primer año)</span>
                  </div>
                  <p className="pricing-description">Luego USD 24/año en renovación.</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item"><Check className="feature-icon" /><span>Todo lo de Free</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Hasta 10 fotos y 3 videos</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Mejor visibilidad en búsquedas</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Estadísticas de perfil y postulaciones</span></li>
                </ul>
                <button className="pricing-button" data-testid="talent-pro-btn">Mejorar a Pro</button>
              </div>

              <div className="pricing-card" data-testid="talent-featured-plan">
                <div className="pricing-header">
                  <h3 className="pricing-name">Talento Destacado</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$1.5</span>
                    <span className="price-period">/mes (año 1)</span>
                  </div>
                  <p className="pricing-description">Add-on para perfiles Pro. Luego USD 3/mes.</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item"><Check className="feature-icon" /><span>Aparición como “Talento recomendado”</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Prioridad en vitrinas y listados clave</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Mayor exposición frente a productoras</span></li>
                </ul>
                <button className="pricing-button" data-testid="talent-featured-btn">Quiero destacar</button>
              </div>
            </div>
          </section>

          <section className="pricing-section">
            <h2 className="pricing-section-title">Productoras</h2>
            <div className="pricing-grid">
              <div className="pricing-card" data-testid="producer-starter-plan">
                <div className="pricing-header">
                  <h3 className="pricing-name">Starter</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$49</span>
                    <span className="price-period">/año</span>
                  </div>
                  <p className="pricing-description">Para equipos que están empezando.</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item"><Check className="feature-icon" /><span>Hasta 2 castings por mes (no acumulables)</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Gestión de postulaciones</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>1 usuario de equipo</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Dashboard básico</span></li>
                </ul>
                <button className="pricing-button" data-testid="producer-starter-btn">Comenzar Starter</button>
              </div>

              <div className="pricing-card pricing-card-featured" data-testid="producer-pro-plan">
                <div className="pricing-badge pricing-badge-popular">Recomendado</div>
                <div className="pricing-header">
                  <h3 className="pricing-name">Pro</h3>
                  <div className="pricing-price">
                    <span className="price-amount">$149</span>
                    <span className="price-period">/año</span>
                  </div>
                  <p className="pricing-description">Para operación constante de casting.</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item"><Check className="feature-icon" /><span>Hasta 10 castings por mes (no acumulables)</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Filtros y gestión avanzada</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Hasta 3 usuarios de equipo</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Soporte prioritario</span></li>
                </ul>
                <button className="pricing-button pricing-button-featured" data-testid="producer-pro-btn">Escalar a Pro</button>
              </div>
            </div>
          </section>

          <section className="pricing-section">
            <h2 className="pricing-section-title">Agencias</h2>
            <div className="pricing-grid-single">
              <div className="pricing-card pricing-card-agency" data-testid="agency-coming-soon-plan">
                <div className="pricing-badge pricing-badge-soon">PRONTO</div>
                <div className="pricing-header">
                  <h3 className="pricing-name">Plan Agencia</h3>
                  <div className="pricing-price">
                    <span className="price-amount">Desde $399</span>
                    <span className="price-period">/año</span>
                  </div>
                  <p className="pricing-description">Diseñado para operación multi-cliente y alto volumen.</p>
                </div>
                <ul className="pricing-features">
                  <li className="feature-item"><Check className="feature-icon" /><span>Gestión multi-cliente</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Mayor volumen mensual de castings</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Flujos para equipos y cuentas avanzadas</span></li>
                  <li className="feature-item"><Check className="feature-icon" /><span>Soporte dedicado</span></li>
                </ul>
                <button className="pricing-button" data-testid="agency-waitlist-btn">Unirme a lista de espera</button>
              </div>
            </div>
          </section>

          <section className="pricing-notes" data-testid="pricing-notes">
            <p>Valores en USD. Planes anuales facturados por adelantado.</p>
            <p>Límites mensuales no acumulables. Se aplican Términos y Política de Plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Precios;
