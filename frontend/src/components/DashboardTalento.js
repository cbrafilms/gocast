import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardTalento = ({ user }) => {
  const { logout, token } = useAuth();
  const [castings, setCastings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCastings();
  }, []);

  const fetchCastings = async () => {
    try {
      const response = await axios.get(`${API}/castings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCastings(response.data);
    } catch (error) {
      console.error('Error al cargar castings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="gocast-container">
      <div className="dashboard-container">
        {/* Header del Dashboard */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Bienvenido, {user.nombre}! 🎭</h1>
            <p className="dashboard-subtitle">Panel de Talento</p>
          </div>
          <button onClick={handleLogout} className="btn-logout" data-testid="logout-btn">
            Cerrar Sesión
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <p className="stat-label">Invitaciones</p>
              <p className="stat-value">0</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Aplicaciones</p>
              <p className="stat-value">0</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <p className="stat-label">Vistas de Perfil</p>
              <p className="stat-value">0</p>
            </div>
          </div>
        </div>

        {/* Sección de Castings Disponibles */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Castings Disponibles</h2>
            <Link to="/castings" className="btn-secondary-small">Ver Todos</Link>
          </div>

          {loading ? (
            <p>Cargando castings...</p>
          ) : castings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🎬</p>
              <p className="empty-title">No hay castings disponibles aún</p>
              <p className="empty-text">Pronto las productoras comenzarán a publicar castings.</p>
            </div>
          ) : (
            <div className="castings-grid">
              {castings.slice(0, 3).map((casting) => (
                <div key={casting.id} className="casting-card" data-testid="casting-card">
                  <h3 className="casting-title">{casting.titulo}</h3>
                  <p className="casting-description">{casting.descripcion}</p>
                  <div className="casting-meta">
                    <span className="casting-type">{casting.tipo}</span>
                    <span className="casting-date">{new Date(casting.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                  <button className="btn-primary-small">Ver Detalles</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="dashboard-section">
          <h2 className="section-title">Mi Perfil</h2>
          <div className="profile-card">
            <div className="profile-info">
              <p><strong>Nombre:</strong> {user.nombre}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo:</strong> Talento</p>
              <p><strong>Miembro desde:</strong> {new Date(user.fecha_registro).toLocaleDateString()}</p>
            </div>
            <Link to="/perfil" className="btn-primary-small">Editar Perfil</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTalento;