import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GestionCasting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [casting, setCasting] = useState(null);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [preseleccionados, setPreseleccionados] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('aplicaciones');
  const [showCreateShortlist, setShowCreateShortlist] = useState(false);
  const [shortlistName, setShortlistName] = useState('');
  const [selectedForShortlist, setSelectedForShortlist] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user || user.tipo_usuario !== 'productora') {
      navigate('/dashboard');
      return;
    }
    if (token) {
      fetchData();
    }
  }, [id, token, user]);

  const fetchData = async () => {
    try {
      // Obtener casting
      const castingRes = await axios.get(`${API}/castings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCasting(castingRes.data);

      // Obtener aplicaciones
      const appsRes = await axios.get(`${API}/aplicaciones-recibidas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const appsCasting = appsRes.data.filter(a => a.casting_id === id);
      setAplicaciones(appsCasting);

      // Obtener preseleccionados
      const preRes = await axios.get(`${API}/castings/${id}/preseleccionados`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreseleccionados(preRes.data);

      // Obtener shortlists
      const shortRes = await axios.get(`${API}/castings/${id}/shortlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShortlists(shortRes.data);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setErrorMessage('Error al cargar datos del casting');
    } finally {
      setLoading(false);
    }
  };

  const handlePreseleccionar = async (aplicacionId, esBackup = false) => {
    try {
      await axios.post(`${API}/aplicaciones/${aplicacionId}/preseleccionar?es_backup=${esBackup}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Talento preseleccionado!');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || 'Error al preseleccionar');
    }
  };

  const handleCreateShortlist = async () => {
    if (!shortlistName.trim()) {
      setErrorMessage('Ingresa un nombre para el shortlist');
      return;
    }
    if (selectedForShortlist.length === 0) {
      setErrorMessage('Selecciona al menos un talento');
      return;
    }

    try {
      const response = await axios.post(`${API}/shortlists`, {
        casting_id: id,
        nombre: shortlistName,
        talentos: selectedForShortlist.map(s => ({
          talento_id: s.talento_id,
          rol_nombre: s.rol_nombre || 'General',
          es_backup: s.es_backup || false
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage(`Shortlist creado! URL: ${BACKEND_URL}/shortlist/${response.data.url_publica}`);
      setShowCreateShortlist(false);
      setShortlistName('');
      setSelectedForShortlist([]);
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || 'Error al crear shortlist');
    }
  };

  const toggleSelectForShortlist = (app) => {
    setSelectedForShortlist(prev => {
      const exists = prev.find(s => s.talento_id === app.talento_id);
      if (exists) {
        return prev.filter(s => s.talento_id !== app.talento_id);
      } else {
        return [...prev, {
          talento_id: app.talento_id,
          talento_nombre: app.talento_perfil?.nombre_completo,
          rol_nombre: app.rol_nombre || 'General',
          es_backup: app.es_backup || false
        }];
      }
    });
  };

  const copyShortlistUrl = (urlPublica) => {
    const fullUrl = `${window.location.origin}/ver-shortlist/${urlPublica}`;
    navigator.clipboard.writeText(fullUrl);
    setSuccessMessage('URL copiada al portapapeles!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (!user || user.tipo_usuario !== 'productora') {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="error-message">No autorizado</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="gestion-container" data-testid="gestion-casting">
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
          
          <div className="gestion-header">
            <div>
              <h1 className="page-title">Gestionar Casting</h1>
              <p className="page-subtitle">{casting?.titulo}</p>
            </div>
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {/* Tabs */}
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'aplicaciones' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('aplicaciones')}
            >
              Aplicaciones ({aplicaciones.filter(a => a.estado === 'pendiente').length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'preseleccionados' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('preseleccionados')}
            >
              Preseleccionados ({preseleccionados.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'shortlists' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('shortlists')}
            >
              Shortlists ({shortlists.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Aplicaciones */}
            {activeTab === 'aplicaciones' && (
              <div className="aplicaciones-section">
                <h2 className="section-title">Aplicaciones Recibidas</h2>
                {aplicaciones.filter(a => a.estado === 'pendiente').length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-icon">📭</p>
                    <p className="empty-title">Sin aplicaciones pendientes</p>
                  </div>
                ) : (
                  <div className="aplicaciones-grid">
                    {aplicaciones.filter(a => a.estado === 'pendiente').map((app) => (
                      <div key={app.id} className="aplicacion-card" data-testid="aplicacion-card">
                        <div className="aplicacion-avatar">
                          {app.talento_nombre?.charAt(0) || '?'}
                        </div>
                        <div className="aplicacion-info">
                          <h3>{app.talento_nombre}</h3>
                          <p className="aplicacion-fecha">
                            Aplicó: {new Date(app.fecha_aplicacion).toLocaleDateString()}
                          </p>
                          {app.mensaje && <p className="aplicacion-mensaje">"{app.mensaje}"</p>}
                        </div>
                        <div className="aplicacion-actions">
                          <button 
                            onClick={() => handlePreseleccionar(app.id, false)}
                            className="btn-preselect"
                          >
                            Preseleccionar
                          </button>
                          <button 
                            onClick={() => handlePreseleccionar(app.id, true)}
                            className="btn-backup"
                          >
                            Como Backup
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preseleccionados */}
            {activeTab === 'preseleccionados' && (
              <div className="preseleccionados-section">
                <div className="section-header">
                  <h2 className="section-title">Talentos Preseleccionados</h2>
                  {preseleccionados.length > 0 && (
                    <button 
                      onClick={() => setShowCreateShortlist(true)}
                      className="btn-primary"
                    >
                      Crear Shortlist
                    </button>
                  )}
                </div>

                {preseleccionados.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-icon">📋</p>
                    <p className="empty-title">Sin talentos preseleccionados</p>
                    <p className="empty-text">Revisa las aplicaciones y preselecciona los mejores talentos</p>
                  </div>
                ) : (
                  <div className="preseleccionados-grid">
                    {preseleccionados.map((app) => (
                      <div key={app.id} className={`preselect-card ${app.es_backup ? 'is-backup' : ''}`}>
                        <div className="preselect-badge">
                          {app.es_backup ? 'BACKUP' : 'TITULAR'}
                        </div>
                        <div className="preselect-avatar">
                          {app.talento_perfil?.nombre_completo?.charAt(0) || '?'}
                        </div>
                        <h3>{app.talento_perfil?.nombre_completo}</h3>
                        <div className="preselect-info">
                          <p>{app.talento_perfil?.tipo_talento}</p>
                          <p>{app.talento_perfil?.edad} años - {app.talento_perfil?.altura_cm} cm</p>
                          <p>{app.talento_perfil?.ciudad}</p>
                        </div>
                        
                        {showCreateShortlist && (
                          <label className="select-checkbox">
                            <input 
                              type="checkbox"
                              checked={selectedForShortlist.some(s => s.talento_id === app.talento_id)}
                              onChange={() => toggleSelectForShortlist(app)}
                            />
                            <span>Incluir en shortlist</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal crear shortlist */}
                {showCreateShortlist && (
                  <div className="shortlist-form">
                    <h3>Crear Shortlist para Compartir</h3>
                    <div className="form-group">
                      <label className="form-label">Nombre del Shortlist</label>
                      <input 
                        type="text"
                        value={shortlistName}
                        onChange={(e) => setShortlistName(e.target.value)}
                        className="form-input"
                        placeholder="Ej: Seleccion Final para Cliente X"
                      />
                    </div>
                    <p className="helper-text">
                      Seleccionados: {selectedForShortlist.length} talento(s)
                    </p>
                    <div className="form-actions">
                      <button onClick={handleCreateShortlist} className="btn-primary">
                        Crear y Generar URL
                      </button>
                      <button onClick={() => {
                        setShowCreateShortlist(false);
                        setSelectedForShortlist([]);
                      }} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shortlists */}
            {activeTab === 'shortlists' && (
              <div className="shortlists-section">
                <h2 className="section-title">Shortlists Creados</h2>
                {shortlists.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-icon">🔗</p>
                    <p className="empty-title">Sin shortlists</p>
                    <p className="empty-text">Preselecciona talentos y crea un shortlist para compartir con tu cliente</p>
                  </div>
                ) : (
                  <div className="shortlists-list">
                    {shortlists.map((sl) => (
                      <div key={sl.id} className="shortlist-card">
                        <div className="shortlist-info">
                          <h3>{sl.nombre}</h3>
                          <p>{sl.talentos.length} talento(s) incluidos</p>
                          <p className="shortlist-date">Creado: {new Date(sl.fecha_creacion).toLocaleDateString()}</p>
                        </div>
                        <div className="shortlist-url">
                          <code>/ver-shortlist/{sl.url_publica}</code>
                        </div>
                        <button 
                          onClick={() => copyShortlistUrl(sl.url_publica)}
                          className="btn-copy"
                        >
                          Copiar URL
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionCasting;
