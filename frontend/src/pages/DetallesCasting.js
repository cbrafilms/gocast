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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCasting();
    checkSiAplico();
  }, [id]);

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
        <div className="detalle-casting-container">
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
          
          <div className="casting-detalle-card">
            <div className="casting-detalle-header">
              <h1 className="casting-detalle-title">{casting.titulo}</h1>
              <span className={`casting-badge casting-badge-${casting.estado}`}>
                {casting.estado.toUpperCase()}
              </span>
            </div>

            <div className="casting-detalle-info">
              <div className="info-row">
                <span className="info-label">Productora:</span>
                <span className="info-value">{casting.productora_nombre}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tipo de Talento:</span>
                <span className="info-value">{casting.tipo}</span>
              </div>
              {casting.genero && (
                <div className="info-row">
                  <span className="info-label">Género:</span>
                  <span className="info-value">{casting.genero}</span>
                </div>
              )}
              {(casting.edad_min || casting.edad_max) && (
                <div className="info-row">
                  <span className="info-label">Edad:</span>
                  <span className="info-value">
                    {casting.edad_min && casting.edad_max
                      ? `${casting.edad_min} - ${casting.edad_max} años`
                      : casting.edad_min
                      ? `${casting.edad_min}+ años`
                      : `Hasta ${casting.edad_max} años`}
                  </span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Ubicación:</span>
                <span className="info-value">{casting.ubicacion}</span>
              </div>
              {casting.fecha_limite && (
                <div className="info-row">
                  <span className="info-label">Fecha Límite:</span>
                  <span className="info-value">{new Date(casting.fecha_limite).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="casting-detalle-section">
              <h3 className="section-subtitle">Descripción</h3>
              <p className="casting-descripcion-completa">{casting.descripcion}</p>
            </div>

            {casting.requisitos && (
              <div className="casting-detalle-section">
                <h3 className="section-subtitle">Requisitos</h3>
                <p className="casting-descripcion-completa">{casting.requisitos}</p>
              </div>
            )}

            {user && user.tipo_usuario === 'talento' && (
              <div className="aplicar-section">
                {successMessage && (
                  <div className="success-message">{successMessage}</div>
                )}
                
                {errorMessage && (
                  <div className="error-message">{errorMessage}</div>
                )}

                {yaAplico ? (
                  <div className="alert-info">
                    <p className="alert-title">✅ Ya aplicaste a este casting</p>
                    <p className="alert-text">La productora revisará tu aplicación y te contactará si eres seleccionado.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="section-subtitle">Aplicar a este Casting</h3>
                    <div className="form-group">
                      <label className="form-label">Mensaje para la Productora (Opcional)</label>
                      <textarea
                        className="form-input"
                        rows="4"
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Cuéntales por qué eres el indicado para este papel..."
                      />
                    </div>
                    <button
                      onClick={handleAplicar}
                      disabled={aplicando}
                      className="btn-submit"
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