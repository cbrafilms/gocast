import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DetallesCasting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [casting, setCasting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aplicando, setAplicando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [yaAplico, setYaAplico] = useState(false);
  const [invitacion, setInvitacion] = useState(null);
  const [respondiendo, setRespondiendo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCasting();
    if (user.tipo_usuario === 'talento') {
      checkSiAplico();
      checkInvitacion();
    }
  }, [id, user]);

  const fetchCasting = async () => {
    try {
      const response = await axios.get(`${API}/castings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCasting(response.data);
    } catch (error) {
      console.error('Error al cargar casting:', error);
      setErrorMessage('No se pudo cargar el casting');
    } finally {
      setLoading(false);
    }
  };

  const checkSiAplico = async () => {
    try {
      const response = await axios.get(`${API}/mis-aplicaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const aplico = response.data.some(app => app.casting_id === id);
      setYaAplico(aplico);
    } catch (error) {
      console.error('Error al verificar aplicaciones:', error);
    }
  };

  const checkInvitacion = async () => {
    try {
      const response = await axios.get(`${API}/mis-invitaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inv = response.data.find(i => i.casting_id === id);
      setInvitacion(inv || null);
    } catch (error) {
      console.error('Error al verificar invitaciones:', error);
    }
  };

  const handleAplicar = async () => {
    if (user.tipo_usuario !== 'talento') {
      setErrorMessage('Solo los talentos pueden aplicar a castings');
      return;
    }

    setAplicando(true);
    setErrorMessage('');

    try {
      await axios.post(
        `${API}/aplicaciones`,
        { casting_id: id, mensaje },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('¡Aplicación enviada exitosamente!');
      setYaAplico(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error al aplicar:', error);
      setErrorMessage(error.response?.data?.detail || 'Error al aplicar al casting');
    } finally {
      setAplicando(false);
    }
  };

  const handleResponderInvitacion = async (respuesta) => {
    if (!invitacion) return;
    
    setRespondiendo(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams();
      params.append('respuesta', respuesta);
      if (respuesta === 'rechazada' && motivoRechazo) {
        params.append('mensaje_respuesta', motivoRechazo);
      }

      await axios.put(
        `${API}/invitaciones/${invitacion.id}/responder?${params.toString()}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(respuesta === 'aceptada' 
        ? '¡Has aceptado la invitación!' 
        : 'Has rechazado la invitación');
      
      setInvitacion(prev => ({ ...prev, estado: respuesta }));
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error al responder:', error);
      setErrorMessage(error.response?.data?.detail || 'Error al responder la invitación');
    } finally {
      setRespondiendo(false);
    }
  };

  if (loading) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <p>Cargando casting...</p>
        </div>
      </div>
    );
  }

  if (!casting) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="error-message">Casting no encontrado</div>
          <Link to="/dashboard" className="btn-primary">Volver al Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="detalle-casting-container" data-testid="casting-detail">
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
          
          {/* Header */}
          <div className="casting-detalle-card">
            <div className="casting-detalle-header">
              <h1 className="casting-detalle-title" data-testid="casting-title">{casting.titulo}</h1>
              <span className={`casting-badge casting-badge-${casting.estado}`}>
                {casting.estado.toUpperCase()}
              </span>
            </div>

            {/* Info General */}
            <div className="casting-detalle-info">
              <div className="info-row">
                <span className="info-label">Productora:</span>
                <span className="info-value">{casting.productora_nombre}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ubicación:</span>
                <span className="info-value">{casting.ubicacion}</span>
              </div>
              {casting.territorios && casting.territorios.length > 0 && (
                <div className="info-row">
                  <span className="info-label">Territorios:</span>
                  <span className="info-value">{casting.territorios.join(', ')}</span>
                </div>
              )}
              {casting.duracion_exhibicion && (
                <div className="info-row">
                  <span className="info-label">Duración:</span>
                  <span className="info-value">{casting.duracion_exhibicion}</span>
                </div>
              )}
              {casting.fecha_limite_postulacion && (
                <div className="info-row">
                  <span className="info-label">Fecha Límite:</span>
                  <span className="info-value">{new Date(casting.fecha_limite_postulacion).toLocaleDateString()}</span>
                </div>
              )}
              {casting.fecha_produccion && (
                <div className="info-row">
                  <span className="info-label">Producción:</span>
                  <span className="info-value">{new Date(casting.fecha_produccion).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className="casting-detalle-section">
              <h3 className="section-subtitle">Descripción del Proyecto</h3>
              <p className="casting-descripcion-completa">{casting.descripcion}</p>
            </div>

            {casting.requisitos_generales && (
              <div className="casting-detalle-section">
                <h3 className="section-subtitle">Requisitos Generales</h3>
                <p className="casting-descripcion-completa">{casting.requisitos_generales}</p>
              </div>
            )}

            {/* Roles del Casting */}
            {casting.roles && casting.roles.length > 0 && (
              <div className="casting-detalle-section">
                <h3 className="section-subtitle">Roles Disponibles ({casting.roles.length})</h3>
                <div className="roles-list">
                  {casting.roles.map((rol, index) => (
                    <div key={index} className="rol-detail-card" data-testid={`rol-${index}`}>
                      <div className="rol-detail-header">
                        <h4 className="rol-detail-title">{rol.nombre_rol}</h4>
                        {rol.monto && (
                          <span className="rol-monto">${rol.monto} USD</span>
                        )}
                      </div>
                      <p className="rol-descripcion">{rol.descripcion_rol}</p>
                      
                      <div className="rol-requisitos">
                        {rol.tipo_talento && (
                          <span className="requisito-tag">Tipo: {rol.tipo_talento}</span>
                        )}
                        {rol.sexo && (
                          <span className="requisito-tag">Género: {rol.sexo}</span>
                        )}
                        {(rol.edad_min || rol.edad_max) && (
                          <span className="requisito-tag">
                            Edad: {rol.edad_min || '?'} - {rol.edad_max || '?'} años
                          </span>
                        )}
                        {(rol.altura_min || rol.altura_max) && (
                          <span className="requisito-tag">
                            Altura: {rol.altura_min || '?'} - {rol.altura_max || '?'} cm
                          </span>
                        )}
                        {rol.color_pelo && (
                          <span className="requisito-tag">Pelo: {rol.color_pelo}</span>
                        )}
                        {rol.color_ojos && (
                          <span className="requisito-tag">Ojos: {rol.color_ojos}</span>
                        )}
                        {rol.talla_camisa && (
                          <span className="requisito-tag">Camisa: {rol.talla_camisa}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección para Talentos */}
            {user && user.tipo_usuario === 'talento' && (
              <div className="aplicar-section">
                {successMessage && (
                  <div className="success-message" data-testid="success-msg">{successMessage}</div>
                )}
                
                {errorMessage && (
                  <div className="error-message" data-testid="error-msg">{errorMessage}</div>
                )}

                {/* Si tiene invitación pendiente */}
                {invitacion && invitacion.estado === 'pendiente' && (
                  <div className="invitacion-card" data-testid="invitacion-pendiente">
                    <h3 className="section-subtitle">📧 Tienes una Invitación</h3>
                    <p className="invitacion-info">
                      <strong>{casting.productora_nombre}</strong> te ha invitado para el rol de <strong>{invitacion.rol_nombre}</strong>
                    </p>
                    {invitacion.mensaje && (
                      <p className="invitacion-mensaje">"{invitacion.mensaje}"</p>
                    )}
                    
                    <div className="invitacion-actions">
                      <button
                        onClick={() => handleResponderInvitacion('aceptada')}
                        disabled={respondiendo}
                        className="btn-accept"
                        data-testid="btn-aceptar"
                      >
                        ✅ Aceptar Invitación
                      </button>
                      
                      <div className="rechazo-section">
                        <textarea
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Motivo del rechazo (opcional)"
                          className="form-input"
                          rows="2"
                        />
                        <button
                          onClick={() => handleResponderInvitacion('rechazada')}
                          disabled={respondiendo}
                          className="btn-reject"
                          data-testid="btn-rechazar"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Si ya respondió la invitación */}
                {invitacion && invitacion.estado !== 'pendiente' && (
                  <div className={`alert-info ${invitacion.estado === 'aceptada' ? 'alert-success' : 'alert-rejected'}`}>
                    <p className="alert-title">
                      {invitacion.estado === 'aceptada' ? '✅ Invitación Aceptada' : '❌ Invitación Rechazada'}
                    </p>
                    <p className="alert-text">
                      {invitacion.estado === 'aceptada' 
                        ? 'Has aceptado participar en este casting. La productora se pondrá en contacto contigo.' 
                        : 'Rechazaste esta invitación.'}
                    </p>
                  </div>
                )}

                {/* Si ya aplicó */}
                {yaAplico && !invitacion && (
                  <div className="alert-info">
                    <p className="alert-title">✅ Ya aplicaste a este casting</p>
                    <p className="alert-text">La productora revisará tu aplicación y te contactará si eres seleccionado.</p>
                  </div>
                )}

                {/* Formulario para aplicar (si no tiene invitación ni aplicación) */}
                {!yaAplico && !invitacion && (
                  <>
                    <h3 className="section-subtitle">Aplicar a este Casting</h3>
                    <div className="form-group">
                      <label className="form-label">Mensaje para la Productora (Opcional)</label>
                      <textarea
                        className="form-input"
                        rows="4"
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Cuéntales por qué eres el indicado para este proyecto..."
                        data-testid="mensaje-input"
                      />
                    </div>
                    <button
                      onClick={handleAplicar}
                      disabled={aplicando}
                      className="btn-submit"
                      data-testid="btn-aplicar"
                    >
                      {aplicando ? 'Enviando Aplicación...' : 'Aplicar Ahora'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallesCasting;