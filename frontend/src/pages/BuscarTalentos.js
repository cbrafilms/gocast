import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BuscarTalentos = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [filtros, setFiltros] = useState({
    tipo_talento: '',
    sexo: '',
    edad_min: '',
    edad_max: '',
    altura_min: '',
    altura_max: '',
    color_pelo: '',
    color_ojos: '',
    talla_camisa: '',
    talla_pantalon: '',
    talla_zapatos: '',
    ciudad: '',
    pais: ''
  });
  
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [misCastings, setMisCastings] = useState([]);
  const [loadingCastings, setLoadingCastings] = useState(false);
  const [inviteData, setInviteData] = useState({
    casting_id: '',
    rol_nombre: '',
    mensaje: ''
  });
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [perfilDetalle, setPerfilDetalle] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  // Cargar castings al montar el componente
  useEffect(() => {
    if (user && user.tipo_usuario === 'productora') {
      cargarMisCastings();
    }
  }, [user, token]);

  const cargarMisCastings = async () => {
    setLoadingCastings(true);
    try {
      const response = await axios.get(`${API}/mis-castings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Castings cargados:', response.data);
      const castingsActivos = response.data.filter(c => c.estado === 'activo');
      setMisCastings(castingsActivos);
    } catch (error) {
      console.error('Error al cargar castings:', error);
    } finally {
      setLoadingCastings(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${API}/buscar-talentos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResultados(response.data);
    } catch (error) {
      console.error('Error al buscar talentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFiltros({
      tipo_talento: '',
      sexo: '',
      edad_min: '',
      edad_max: '',
      altura_min: '',
      altura_max: '',
      color_pelo: '',
      color_ojos: '',
      talla_camisa: '',
      talla_pantalon: '',
      talla_zapatos: '',
      ciudad: '',
      pais: ''
    });
    setResultados([]);
    setSearched(false);
  };

  const openInviteModal = (talento) => {
    setSelectedTalent(talento);
    setInviteSuccess('');
    setInviteError('');
    setInviteData({ casting_id: '', rol_nombre: '', mensaje: '' });
    setShowInviteModal(true);
  };

  const handleInvite = async () => {
    if (!inviteData.casting_id) {
      setInviteError('Selecciona un casting');
      return;
    }
    if (!inviteData.rol_nombre) {
      setInviteError('Selecciona un rol');
      return;
    }

    try {
      await axios.post(`${API}/invitaciones`, {
        casting_id: inviteData.casting_id,
        rol_nombre: inviteData.rol_nombre,
        talento_id: selectedTalent.user_id,
        mensaje: inviteData.mensaje
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInviteSuccess('Invitacion enviada exitosamente!');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteData({ casting_id: '', rol_nombre: '', mensaje: '' });
      }, 2000);
    } catch (error) {
      setInviteError(error.response?.data?.detail || 'Error al enviar invitacion');
    }
  };

  const openPerfilModal = async (talentoId) => {
    setShowPerfilModal(true);
    setLoadingPerfil(true);
    setPerfilDetalle(null);
    try {
      const response = await axios.get(`${API}/talentos/${talentoId}/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerfilDetalle(response.data);
    } catch (error) {
      setPerfilDetalle(null);
    } finally {
      setLoadingPerfil(false);
    }
  };

  const selectedCasting = misCastings.find(c => c.id === inviteData.casting_id);

  if (!user || user.tipo_usuario !== 'productora') {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="error-message">Solo las productoras pueden buscar talentos.</div>
          <Link to="/dashboard" className="btn-primary">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="buscar-talentos-container" data-testid="buscar-talentos">
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
          
          <div className="page-header">
            <h1 className="page-title">Buscar Talentos</h1>
            <p className="page-subtitle">Encuentra el talento perfecto para tu proyecto</p>
          </div>

          <form onSubmit={handleSearch} className="filtros-card">
            <h2 className="card-title">Filtros de Busqueda</h2>
            
            <div className="filtros-grid">
              <div className="form-group">
                <label className="form-label">Tipo de Talento</label>
                <select name="tipo_talento" value={filtros.tipo_talento} onChange={handleChange} className="form-input">
                  <option value="">Todos</option>
                  <option value="actor">Actor/Actriz</option>
                  <option value="modelo">Modelo</option>
                  <option value="voz">Voz en Off</option>
                  <option value="extra">Extra</option>
                  <option value="bailarin">Bailarin</option>
                  <option value="musico">Musico</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Genero</label>
                <select name="sexo" value={filtros.sexo} onChange={handleChange} className="form-input">
                  <option value="">Cualquiera</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Edad Minima</label>
                <input type="number" name="edad_min" value={filtros.edad_min} onChange={handleChange} className="form-input" placeholder="18" min="0" />
              </div>

              <div className="form-group">
                <label className="form-label">Edad Maxima</label>
                <input type="number" name="edad_max" value={filtros.edad_max} onChange={handleChange} className="form-input" placeholder="65" min="0" />
              </div>

              <div className="form-group">
                <label className="form-label">Altura Min (cm)</label>
                <input type="number" name="altura_min" value={filtros.altura_min} onChange={handleChange} className="form-input" placeholder="150" />
              </div>

              <div className="form-group">
                <label className="form-label">Altura Max (cm)</label>
                <input type="number" name="altura_max" value={filtros.altura_max} onChange={handleChange} className="form-input" placeholder="190" />
              </div>

              <div className="form-group">
                <label className="form-label">Color de Pelo</label>
                <select name="color_pelo" value={filtros.color_pelo} onChange={handleChange} className="form-input">
                  <option value="">Cualquiera</option>
                  <option value="negro">Negro</option>
                  <option value="castano">Castano</option>
                  <option value="rubio">Rubio</option>
                  <option value="pelirrojo">Pelirrojo</option>
                  <option value="gris">Gris/Canoso</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Color de Ojos</label>
                <select name="color_ojos" value={filtros.color_ojos} onChange={handleChange} className="form-input">
                  <option value="">Cualquiera</option>
                  <option value="marrones">Marrones</option>
                  <option value="verdes">Verdes</option>
                  <option value="azules">Azules</option>
                  <option value="grises">Grises</option>
                  <option value="negros">Negros</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Talla Camisa</label>
                <select name="talla_camisa" value={filtros.talla_camisa} onChange={handleChange} className="form-input">
                  <option value="">Cualquiera</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Talla Pantalon</label>
                <input type="text" name="talla_pantalon" value={filtros.talla_pantalon} onChange={handleChange} className="form-input" placeholder="Ej: 32" />
              </div>

              <div className="form-group">
                <label className="form-label">Talla Zapatos</label>
                <input type="text" name="talla_zapatos" value={filtros.talla_zapatos} onChange={handleChange} className="form-input" placeholder="Ej: 42" />
              </div>

              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input type="text" name="ciudad" value={filtros.ciudad} onChange={handleChange} className="form-input" placeholder="Buenos Aires" />
              </div>

              <div className="form-group">
                <label className="form-label">Pais</label>
                <input type="text" name="pais" value={filtros.pais} onChange={handleChange} className="form-input" placeholder="Argentina" />
              </div>
            </div>

            <div className="filtros-actions">
              <button type="submit" className="btn-primary" disabled={loading} data-testid="btn-buscar">
                {loading ? 'Buscando...' : 'Buscar Talentos'}
              </button>
              <button type="button" onClick={handleClearFilters} className="btn-secondary">
                Limpiar Filtros
              </button>
            </div>
          </form>

          <div className="resultados-section">
            {loading ? (
              <p className="loading-text">Buscando talentos...</p>
            ) : searched && resultados.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon">🔍</p>
                <p className="empty-title">No se encontraron talentos</p>
                <p className="empty-text">Intenta ajustar los filtros de busqueda</p>
              </div>
            ) : resultados.length > 0 ? (
              <>
                <h2 className="section-title">{resultados.length} Talento(s) Encontrado(s)</h2>
                <div className="talentos-grid">
                  {resultados.map((talento) => (
                    <div key={talento.id || talento.user_id} className="talento-card" data-testid="talento-card">
                      <div className="talento-avatar">
                        {talento.nombre_completo?.charAt(0) || '?'}
                      </div>
                      <h3 className="talento-nombre">{talento.nombre_completo}</h3>
                      <p className="talento-tipo">{talento.tipo_talento}</p>
                      
                      <div className="talento-atributos">
                        <span className="atributo">{talento.edad} anos</span>
                        <span className="atributo">{talento.altura_cm} cm</span>
                        <span className="atributo">{talento.sexo}</span>
                      </div>
                      
                      <div className="talento-ubicacion">
                        {talento.ciudad}, {talento.pais}
                      </div>
                      
                      <p className="talento-descripcion">{talento.descripcion_corta?.substring(0, 80)}...</p>
                      
                      <div className="talento-fisico">
                        <span>Pelo: {talento.color_pelo}</span>
                        <span>Ojos: {talento.color_ojos}</span>
                      </div>

                      {talento.talla_camisa && (
                        <div className="talento-tallas">
                          <span>Camisa: {talento.talla_camisa}</span>
                          {talento.talla_pantalon && <span>Pantalon: {talento.talla_pantalon}</span>}
                          {talento.talla_zapatos && <span>Zapatos: {talento.talla_zapatos}</span>}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button onClick={() => openPerfilModal(talento.user_id)} className="btn-secondary-small">
                          Ver perfil
                        </button>
                        <button onClick={() => openInviteModal(talento)} className="btn-invite" data-testid="btn-invitar">
                          Invitar a Casting
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {showPerfilModal && (
            <div className="modal-overlay" onClick={() => setShowPerfilModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">Perfil del talento</h2>
                {loadingPerfil ? (
                  <p>Cargando...</p>
                ) : !perfilDetalle ? (
                  <p>No se pudo cargar el perfil.</p>
                ) : (
                  <div>
                    <p><strong>Nombre:</strong> {perfilDetalle.user?.nombre}</p>
                    <p><strong>Email:</strong> {perfilDetalle.user?.email}</p>
                    <p><strong>Tipo:</strong> {perfilDetalle.perfil?.tipo_talento}</p>
                    <p><strong>Edad:</strong> {perfilDetalle.perfil?.edad}</p>
                    <p><strong>Ciudad:</strong> {perfilDetalle.perfil?.ciudad}, {perfilDetalle.perfil?.pais}</p>
                    <p><strong>Descripción:</strong> {perfilDetalle.perfil?.descripcion_corta}</p>
                    {perfilDetalle.perfil?.fotos?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        {perfilDetalle.perfil.fotos.map((f, i) => <img key={i} src={f} alt={`foto-${i}`} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />)}
                      </div>
                    )}
                    {perfilDetalle.perfil?.videos?.[0] && (
                      <div style={{ marginTop: 10 }}>
                        <video src={perfilDetalle.perfil.videos[0]} controls style={{ width: 260, maxWidth: '100%', borderRadius: 8 }} />
                      </div>
                    )}
                  </div>
                )}
                <div className="modal-actions">
                  <button onClick={() => setShowPerfilModal(false)} className="btn-secondary">Cerrar</button>
                </div>
              </div>
            </div>
          )}

          {showInviteModal && (
            <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} data-testid="invite-modal">
                <h2 className="modal-title">Invitar a {selectedTalent?.nombre_completo}</h2>
                
                {inviteSuccess && <div className="success-message">{inviteSuccess}</div>}
                {inviteError && <div className="error-message">{inviteError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Seleccionar Casting *</label>
                  {loadingCastings ? (
                    <p>Cargando castings...</p>
                  ) : misCastings.length === 0 ? (
                    <div className="alert-warning">
                      <p>No tienes castings activos.</p>
                      <Link to="/crear-casting" className="btn-primary-small">Crear Casting</Link>
                    </div>
                  ) : (
                    <select 
                      value={inviteData.casting_id} 
                      onChange={(e) => setInviteData(prev => ({ ...prev, casting_id: e.target.value, rol_nombre: '' }))}
                      className="form-input"
                    >
                      <option value="">-- Selecciona un casting --</option>
                      {misCastings.map(casting => (
                        <option key={casting.id} value={casting.id}>
                          {casting.titulo} ({casting.roles?.length || 0} roles)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedCasting && selectedCasting.roles && selectedCasting.roles.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Seleccionar Rol *</label>
                    <select 
                      value={inviteData.rol_nombre} 
                      onChange={(e) => setInviteData(prev => ({ ...prev, rol_nombre: e.target.value }))}
                      className="form-input"
                    >
                      <option value="">-- Selecciona un rol --</option>
                      {selectedCasting.roles.map((rol, idx) => (
                        <option key={idx} value={rol.nombre_rol}>{rol.nombre_rol}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Mensaje (Opcional)</label>
                  <textarea 
                    value={inviteData.mensaje}
                    onChange={(e) => setInviteData(prev => ({ ...prev, mensaje: e.target.value }))}
                    className="form-input"
                    rows="3"
                    placeholder="Escribe un mensaje personalizado..."
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    onClick={handleInvite} 
                    className="btn-primary"
                    disabled={!inviteData.casting_id || !inviteData.rol_nombre}
                  >
                    Enviar Invitacion
                  </button>
                  <button onClick={() => setShowInviteModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuscarTalentos;
