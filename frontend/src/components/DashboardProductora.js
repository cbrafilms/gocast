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
    if (token) {
      fetchMisCastings();
      fetchAplicaciones();
    }
  }, [token]);

  const fetchMisCastings = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/mis-castings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Castings cargados:', response.data);
      setCastings(response.data);
    } catch (error) {
      console.error('Error al cargar castings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAplicaciones = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/aplicaciones-recibidas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Aplicaciones cargadas:', response.data);
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
              <p className="empty-icon">📋</p>
              <p className="empty-title">No tienes castings aun</p>
              <p className="empty-text">Crea tu primer casting para comenzar a recibir aplicaciones de talentos.</p>
              <Link to="/crear-casting" className="btn-primary">Crear Primer Casting</Link>
            </div>
          ) : (
            <div className="castings-grid">
              {castings.map((casting) => (
                <div key={casting.id} className="casting-card" data-testid="casting-card">
                  <h3 className="casting-title">{casting.titulo}</h3>
                  <p className="casting-description">{casting.descripcion?.substring(0, 100)}...</p>
                  <div className="casting-meta">
                    <span className={`casting-status status-${casting.estado}`}>{casting.estado}</span>
                    <span className="casting-date">{new Date(casting.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                  {casting.roles && (
                    <p className="casting-roles">{casting.roles.length} rol(es)</p>
                  )}
                  <div className="casting-card-actions">
                    <Link to={`/casting/${casting.id}`} className="btn-secondary-small">Ver</Link>
                    <Link to={`/gestionar-casting/${casting.id}`} className="btn-primary-small">Gestionar</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {aplicacionesPendientes.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Aplicaciones Recientes</h2>
            <div className="aplicaciones-list">
              {aplicacionesPendientes.slice(0, 5).map((app) => (
                <div key={app.id} className="aplicacion-item">
                  <div className="aplicacion-info">
                    <span className="aplicacion-talento">{app.talento_nombre || 'Talento'}</span>
                    <span className="aplicacion-casting">Para: {app.casting_id}</span>
                  </div>
                  <span className="aplicacion-fecha">
                    {new Date(app.fecha_aplicacion).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <h2 className="section-title">Acciones Rapidas</h2>
          <div className="actions-grid">
            <Link to="/crear-casting" className="action-card">
              <span className="action-icon">➕</span>
              <span className="action-text">Crear Casting</span>
            </Link>
            <Link to="/buscar-talentos" className="action-card">
              <span className="action-icon">🔍</span>
              <span className="action-text">Buscar Talentos</span>
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2 className="section-title">Mi Perfil</h2>
          <div className="profile-card">
            <div className="profile-info">
              <p><strong>Nombre:</strong> {user.nombre}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo:</strong> Productora</p>
              <p><strong>Miembro desde:</strong> {user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : '-'}</p>
              {user.logo_url && <div style={{ marginTop: 10 }}><p><strong>Logo:</strong></p><img src={user.logo_url} alt="logo" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} /></div>}
              {user.reel_url && <p><strong>Reel:</strong> <a href={user.reel_url} target="_blank" rel="noreferrer">Ver YouTube</a></p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProductora;