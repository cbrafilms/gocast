import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardProductora = ({ user }) => {
  const { logout, token } = useAuth();
  const [castings, setCastings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aplicaciones, setAplicaciones] = useState([]);

  useEffect(() => {
    fetchMisCastings();
    fetchAplicaciones();
  }, []);

  const fetchMisCastings = async () => {
    try {
      const response = await axios.get(`${API}/mis-castings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCastings(response.data);
    } catch (error) {
      console.error('Error al cargar castings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAplicaciones = async () => {
    try {
      const response = await axios.get(`${API}/aplicaciones-recibidas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAplicaciones(response.data);
    } catch (error) {
      console.error('Error al cargar aplicaciones:', error);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const aplicacionesPendientes = aplicaciones.filter(a => a.estado === 'pendiente');

  return (
    <div className="gocast-container">
      <div className="dashboard-container" data-testid="dashboard-productora">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Bienvenido, {user.nombre}!</h1>
            <p className="dashboard-subtitle">Panel de Productora</p>
          </div>
          <button onClick={handleLogout} className="btn-logout" data-testid="logout-btn">
            Cerrar Sesion
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <p className="stat-label">Castings Activos</p>
              <p className="stat-value">{castings.filter(c => c.estado === 'activo').length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📥</div>
            <div className="stat-content">
              <p className="stat-label">Aplicaciones Pendientes</p>
              <p className="stat-value">{aplicacionesPendientes.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <div className="stat-content">
              <p className="stat-label">Buscar Talentos</p>
              <Link to="/buscar-talentos" className="btn-primary-small">Explorar</Link>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Mis Castings</h2>
            <Link to="/crear-casting" className="btn-primary" data-testid="crear-casting-btn">
              + Crear Nuevo Casting
            </Link>
          </div>

          {loading ? (
            <p>Cargando castings...</p>
          ) : castings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🎬</p>
              <p className="empty-title">Aún no has creado castings</p>
              <p className="empty-text">Crea tu primer casting y comienza a recibir aplicaciones de talentos.</p>
              <Link to="/crear-casting" className="btn-primary">Crear Mi Primer Casting</Link>
            </div>
          ) : (
            <div className="castings-grid">
              {castings.map((casting) => (
                <div key={casting.id} className="casting-card" data-testid="casting-card">
                  <div className="casting-badge" data-status={casting.estado}>
                    {casting.estado}
                  </div>
                  <h3 className="casting-title">{casting.titulo}</h3>
                  <p className="casting-description">{casting.descripcion}</p>
                  <div className="casting-meta">
                    <span className="casting-type">{casting.tipo}</span>
                    <span className="casting-date">{new Date(casting.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                  <div className="casting-actions">
                    <button className="btn-primary-small">Ver Aplicaciones (0)</button>
                    <button className="btn-secondary-small">Editar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buscar Talentos */}
        <div className="dashboard-section">
          <h2 className="section-title">Buscar Talentos</h2>
          <div className="search-card">
            <p className="search-text">Encuentra el talento perfecto para tu proyecto</p>
            <Link to="/buscar-talentos" className="btn-secondary">Ir a Búsqueda</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProductora;