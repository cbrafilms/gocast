import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VerShortlist = () => {
  const { urlPublica } = useParams();
  const [shortlist, setShortlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTalent, setSelectedTalent] = useState(null);

  useEffect(() => { fetchShortlist(); }, [urlPublica]);

  const fetchShortlist = async () => {
    try {
      const response = await axios.get(`${API}/shortlist/${urlPublica}`);
      setShortlist(response.data);
    } catch {
      setError('Shortlist no encontrado o ya no está disponible');
    } finally {
      setLoading(false);
    }
  };

  const groupedByRole = useMemo(() => {
    const map = {};
    (shortlist?.talentos || []).forEach(t => {
      const rol = t.rol_nombre || 'General';
      if (!map[rol]) map[rol] = [];
      map[rol].push(t);
    });
    return map;
  }, [shortlist]);

  const saveSelection = async (rol, principalId) => {
    await axios.post(`${API}/shortlist/${urlPublica}/seleccion`, {
      rol_nombre: rol,
      principal_talento_id: principalId || null,
    });
    fetchShortlist();
  };

  const finalizarSeleccion = async () => {
    await axios.post(`${API}/shortlist/${urlPublica}/finalizar`, {});
    fetchShortlist();
    alert('Selección enviada a la productora ✅');
  };

  if (loading) return <div className="gocast-page"><div className="gocast-container"><p>Cargando shortlist...</p></div></div>;
  if (error) return <div className="gocast-page"><div className="gocast-container"><div className="error-card"><h1>Shortlist no disponible</h1><p>{error}</p></div></div></div>;

  return (
    <div className="gocast-page shortlist-public">
      <div className="gocast-container">
        <div className="shortlist-public-container">
          <div className="shortlist-header">
            <div className="shortlist-logo">GOCAST.me</div>
            <h1 className="shortlist-title">Talentos Pre Seleccionados</h1>
            <p className="shortlist-casting">Casting: {shortlist?.casting_titulo}</p>
          </div>

          {shortlist?.cliente_finalizado && (
            <div className="success-message" style={{ marginBottom: 12 }}>
              Selección final enviada a la productora.
            </div>
          )}

          {Object.entries(groupedByRole).map(([rol, talentos]) => {
            const sel = shortlist?.cliente_seleccion?.[rol] || {};
            return (
              <div key={rol} className="shortlist-section">
                <h2 className="shortlist-section-title">Rol: {rol}</h2>
                <p style={{ marginBottom: 12 }}>Selecciona el talento principal para este rol.</p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {talentos.map((talento, idx) => (
                    <div key={idx} className="shortlist-talent-card" style={{ maxWidth: 320 }}>
                      <div className="talent-photo">
                        {talento.fotos?.[0]
                          ? <img src={talento.fotos[0]} alt={talento.nombre_completo} style={{ width: '100%', maxWidth: 220, borderRadius: 10 }} />
                          : <div className="talent-avatar-large">{talento.nombre_completo?.charAt(0) || '?'}</div>}
                      </div>
                      <div className="talent-details">
                        <h3>{talento.nombre_completo}</h3>
                        <p>{talento.edad} años · {talento.ciudad}, {talento.pais}</p>
                        <button className="btn-secondary-small" onClick={() => setSelectedTalent(talento)}>Ver perfil completo</button>

                        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                          <label>
                            <input type="radio" name={`principal-${rol}`} checked={String(sel.principal_talento_id || '') === String(talento.talento_id)} onChange={() => saveSelection(rol, talento.talento_id)} /> Principal
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!shortlist?.cliente_finalizado && (
            <div style={{ marginTop: 16 }}>
              <button className="btn-primary" onClick={finalizarSeleccion}>Finalizar selección y avisar productora</button>
            </div>
          )}

          {!!selectedTalent && (
            <div className="modal-overlay" onClick={() => setSelectedTalent(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Perfil completo</h3>
                <p><strong>Nombre:</strong> {selectedTalent.nombre_completo}</p>
                <p><strong>Tipo:</strong> {selectedTalent.tipo_talento}</p>
                <p><strong>Edad:</strong> {selectedTalent.edad}</p>
                <p><strong>Ciudad:</strong> {selectedTalent.ciudad}, {selectedTalent.pais}</p>
                <p><strong>Descripción:</strong> {selectedTalent.descripcion_corta}</p>
                {selectedTalent.fotos?.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{selectedTalent.fotos.map((f, i) => <img key={i} src={f} alt={`foto-${i}`} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />)}</div>}
                {selectedTalent.videos?.[0] && <div style={{ marginTop: 8 }}><video src={selectedTalent.videos[0]} controls style={{ width: 260, maxWidth: '100%' }} /></div>}
                <div className="modal-actions"><button className="btn-secondary" onClick={() => setSelectedTalent(null)}>Cerrar</button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerShortlist;
