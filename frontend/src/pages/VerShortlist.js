import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VerShortlist = () => {
  const { urlPublica } = useParams();
  const [shortlist, setShortlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShortlist();
  }, [urlPublica]);

  const fetchShortlist = async () => {
    try {
      const response = await axios.get(`${API}/shortlist/${urlPublica}`);
      setShortlist(response.data);
    } catch (error) {
      setError('Shortlist no encontrado o ya no esta disponible');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <p>Cargando shortlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="error-card">
            <h1>Shortlist no disponible</h1>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const titulares = shortlist?.talentos?.filter(t => !t.es_backup) || [];
  const backups = shortlist?.talentos?.filter(t => t.es_backup) || [];

  return (
    <div className="gocast-page shortlist-public">
      <div className="gocast-container">
        <div className="shortlist-public-container">
          <div className="shortlist-header">
            <div className="shortlist-logo">GOCAST.me</div>
            <h1 className="shortlist-title">{shortlist?.nombre}</h1>
            <p className="shortlist-casting">Casting: {shortlist?.casting_titulo}</p>
          </div>

          {/* Titulares */}
          <div className="shortlist-section">
            <h2 className="shortlist-section-title">Talentos Seleccionados</h2>
            <div className="shortlist-grid">
              {titulares.map((talento, index) => (
                <div key={index} className="shortlist-talent-card">
                  <div className="talent-photo">
                    <div className="talent-avatar-large">
                      {talento.nombre_completo?.charAt(0) || '?'}
                    </div>
                  </div>
                  <div className="talent-details">
                    <h3>{talento.nombre_completo}</h3>
                    <p className="talent-type">{talento.tipo_talento}</p>
                    <div className="talent-specs">
                      <span>{talento.edad} años</span>
                      <span>{talento.altura_cm} cm</span>
                      <span>{talento.sexo}</span>
                    </div>
                    <div className="talent-physical">
                      <span>Pelo: {talento.color_pelo}</span>
                      <span>Ojos: {talento.color_ojos}</span>
                    </div>
                    {talento.talla_camisa && (
                      <div className="talent-sizes">
                        <span>Talla: {talento.talla_camisa}</span>
                      </div>
                    )}
                    <p className="talent-location">{talento.ciudad}, {talento.pais}</p>
                    {talento.descripcion_corta && (
                      <p className="talent-bio">{talento.descripcion_corta}</p>
                    )}
                    <div className="talent-role">
                      <span className="role-badge">Rol: {talento.rol_nombre}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backups */}
          {backups.length > 0 && (
            <div className="shortlist-section backups-section">
              <h2 className="shortlist-section-title">Talentos Backup</h2>
              <div className="shortlist-grid">
                {backups.map((talento, index) => (
                  <div key={index} className="shortlist-talent-card backup-card">
                    <div className="backup-badge">BACKUP</div>
                    <div className="talent-photo">
                      <div className="talent-avatar-large backup">
                        {talento.nombre_completo?.charAt(0) || '?'}
                      </div>
                    </div>
                    <div className="talent-details">
                      <h3>{talento.nombre_completo}</h3>
                      <p className="talent-type">{talento.tipo_talento}</p>
                      <div className="talent-specs">
                        <span>{talento.edad} años</span>
                        <span>{talento.altura_cm} cm</span>
                        <span>{talento.sexo}</span>
                      </div>
                      <p className="talent-location">{talento.ciudad}, {talento.pais}</p>
                      <div className="talent-role">
                        <span className="role-badge">Rol: {talento.rol_nombre}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="shortlist-footer">
            <p>Seleccion presentada por GOCAST.me</p>
            <p className="shortlist-date">Generado: {new Date(shortlist?.fecha_creacion).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerShortlist;
