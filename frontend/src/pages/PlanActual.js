import React from 'react';

const PlanActual = () => {
  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="success-card" style={{ marginTop: 24 }}>
          <h1 className="page-title">Plan actual</h1>
          <p className="page-subtitle">Aquí podrás gestionar suscripción, pagos y upgrades.</p>

          <div className="stats-grid" style={{ marginTop: 16 }}>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">Plan</p>
                <p className="stat-value">Free Trial</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <p className="stat-label">Estado</p>
                <p className="stat-value">Activo</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-content">
                <p className="stat-label">Próximo paso</p>
                <p className="stat-value">Configurar pagos</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button className="btn-primary">Elegir/Mejorar plan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanActual;
