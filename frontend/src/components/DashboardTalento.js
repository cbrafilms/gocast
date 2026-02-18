import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardTalento = ({ user }) => {
  const { logout, token } = useAuth();
  const [castings, setCastings] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilCompleto, setPerfilCompleto] = useState(false);

  useEffect(() => {
    if (token) {
      checkPerfil();
      fetchCastings();
      fetchInvitaciones();
      fetchAplicaciones();
    }
  }, [token]);

  const checkPerfil = async () => {
    if (!token) return;
    try {
      await axios.get(`${API}/perfil-talento`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerfilCompleto(true);
    } catch (error) {
      setPerfilCompleto(false);
    }
  };

  const fetchCastings = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/castings-recomendados`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCastings(response.data);
    } catch (error) {
      console.error('Error al cargar castings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitaciones = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/mis-invitaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitaciones(response.data);
    } catch (error) {
      console.error('Error al cargar invitaciones:', error);
    }
  };

  const fetchAplicaciones = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/mis-aplicaciones`, {
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

  const invitacionesPendientes = invitaciones.filter(i => i.estado === 'pendiente');

  return (
    <div className="gocast-container">
      <div className="dashboard-container" data-testid="dashboard-talento">
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

        {/* Alerta si no tiene perfil completo */}
        {!perfilCompleto && (
          <div className="alert-warning">
            <p className="alert-title">⚠️ Completa tu perfil</p>
            <p className="alert-text">Debes completar tu perfil para ver castings personalizados y aplicar a ellos.</p>
            <Link to="/completar-perfil" className="btn-primary">Completar Perfil Ahora</Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📧</div>
            <div className="stat-content">
              <p className="stat-label">Invitaciones Pendientes</p>
              <p className="stat-value" data-testid="invitaciones-count">{invitacionesPendientes.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Aplicaciones</p>
              <p className="stat-value" data-testid="aplicaciones-count">{aplicaciones.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎬</div>
            <div className="stat-content">
              <p className="stat-label">Castings Recomendados</p>
              <p className="stat-value">{castings.length}</p>
            </div>
          </div>
        </div>

        {/* Invitaciones Pendientes */}
        {invitacionesPendientes.length > 0 && (
          <div className="dashboard-section invitaciones-section">
            <h2 className="section-title">📧 Invitaciones Pendientes</h2>
            <div className="invitaciones-grid">
              {invitacionesPendientes.map((inv) => (
                <div key={inv.id} className="invitacion-card-small" data-testid="invitacion-card">
                  <div className="invitacion-header">
                    <h3 className="invitacion-titulo">{inv.casting_titulo}</h3>
                    <span className="invitacion-rol">Rol: {inv.rol_nombre}</span>
                  </div>
                  <p className="invitacion-productora">De: {inv.productora_nombre}</p>
                  {inv.mensaje && <p className="invitacion-mensaje">"{inv.mensaje}"</p>}
                  <Link to={`/casting/${inv.casting_id}`} className="btn-primary-small">
                    Ver y Responder
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de Castings Disponibles */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Castings Recomendados Para Ti</h2>
          </div>

          {!perfilCompleto ? (
            <div className="empty-state">
              <p className="empty-icon">📋</p>
              <p className="empty-title">Completa tu perfil para ver castings</p>
              <p className="empty-text">Una vez completes tu perfil, verás aquí los castings que coinciden con tus características.</p>
              <Link to="/completar-perfil" className="btn-primary">Completar Perfil</Link>
            </div>
          ) : loading ? (
            <p>Cargando castings...</p>
          ) : castings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">🎬</p>
              <p className="empty-title">No hay castings disponibles aún</p>
              <p className="empty-text">Pronto las productoras comenzarán a publicar castings que coincidan con tu perfil.</p>
            </div>
          ) : (
            <div className="castings-grid">
              {castings.slice(0, 6).map((casting) => (
                <div key={casting.id} className="casting-card" data-testid="casting-card">
                  <h3 className="casting-title">{casting.titulo}</h3>
                  <p className="casting-description">{casting.descripcion.substring(0, 100)}...</p>
                  <div className="casting-meta">
                    <span className="casting-type">{casting.ubicacion}</span>
                    <span className="casting-date">{new Date(casting.fecha_creacion).toLocaleDateString()}</span>
                  </div>
                  {casting.roles && casting.roles.length > 0 && (
                    <div className="casting-roles-preview">
                      <span className="roles-count">{casting.roles.length} rol(es) disponible(s)</span>
                    </div>
                  )}
                  <Link to={`/casting/${casting.id}`} className="btn-primary-small">Ver Detalles</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mis Aplicaciones */}
        {aplicaciones.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Mis Aplicaciones Recientes</h2>
            <div className="aplicaciones-list">
              {aplicaciones.slice(0, 5).map((app) => (
                <div key={app.id} className="aplicacion-item" data-testid="aplicacion-item">
                  <div className="aplicacion-info">
                    <span className="aplicacion-casting">{app.casting_id}</span>
                    <span className={`aplicacion-estado estado-${app.estado}`}>
                      {app.estado === 'pendiente' ? '⏳ Pendiente' : 
                       app.estado === 'aceptada' ? '✅ Aceptada' : '❌ Rechazada'}
                    </span>
                  </div>
                  <span className="aplicacion-fecha">
                    {new Date(app.fecha_aplicacion).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfil */}
        <div className="dashboard-section">
          <h2 className="section-title">Mi Perfil</h2>
          <div className="profile-card">
            <div className="profile-info">
              <p><strong>Nombre:</strong> {user.nombre}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo:</strong> Talento</p>
              <p><strong>Estado del Perfil:</strong> {perfilCompleto ? '✅ Completo' : '⚠️ Incompleto'}</p>
              <p><strong>Miembro desde:</strong> {new Date(user.fecha_registro).toLocaleDateString()}</p>
            </div>
            <Link to="/editar-perfil" className="btn-primary-small">Editar Perfil</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTalento;