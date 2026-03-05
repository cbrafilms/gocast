import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ESTADOS = ['principal', 'backup', 'quizas', 'rechazado'];

const VerShortlist = () => {
  const { urlPublica } = useParams();
  const [password, setPassword] = useState('');
  const [authOk, setAuthOk] = useState(false);
  const [shortlist, setShortlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchShortlist = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/shortlist/${urlPublica}`, { params: { password } });
      setShortlist(response.data);
      setAuthOk(true);
    } catch (e) {
      setError(e.response?.status === 401 ? 'Contraseña inválida' : 'Shortlist no disponible');
      setAuthOk(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) fetchShortlist();
  }, []);

  const groupedByRole = useMemo(() => {
    const map = {};
    (shortlist?.talentos || []).forEach((t) => {
      const rol = t.rol_nombre || 'General';
      if (!map[rol]) map[rol] = [];
      map[rol].push(t);
    });
    return map;
  }, [shortlist]);

  const saveState = async (rol, talentoId, estado) => {
    await axios.post(`${API}/shortlist/${urlPublica}/seleccion`, {
      password,
      rol_nombre: rol,
      talento_id: String(talentoId),
      estado,
    });
    fetchShortlist();
  };

  const finalizarSeleccion = async () => {
    await axios.post(`${API}/shortlist/${urlPublica}/finalizar`, { password });
    fetchShortlist();
    alert('Selección final enviada a productora ✅');
  };

  if (!authOk) {
    return (
      <div className="gocast-page"><div className="gocast-container"><div className="error-card">
        <h1>Acceso a shortlist</h1>
        <p>Ingresa contraseña entregada por la productora.</p>
        <input className="form-input" type="text" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Contraseña" />
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={fetchShortlist} disabled={loading}>{loading ? 'Validando...' : 'Entrar'}</button>
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      </div></div></div>
    );
  }

  return (
    <div className="gocast-page shortlist-public"><div className="gocast-container"><div className="shortlist-public-container">
      <div className="shortlist-header">
        <div className="shortlist-logo">GOCAST.me</div>
        <h1 className="shortlist-title">Talentos Pre Seleccionados</h1>
        <p className="shortlist-casting">Casting: {shortlist?.casting_titulo}</p>
      </div>

      {shortlist?.cliente_finalizado && <div className="success-message">Selección final enviada a la productora.</div>}

      {Object.entries(groupedByRole).map(([rol, talentos]) => {
        const states = shortlist?.cliente_seleccion?.[rol]?.states || {};
        return (
          <div key={rol} className="shortlist-section">
            <h2 className="shortlist-section-title">Rol: {rol}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {talentos.map((tal) => (
                <div key={tal.talento_id} className="shortlist-talent-card" style={{ maxWidth: 340 }}>
                  {tal.fotos?.[0] ? <img src={tal.fotos[0]} alt={tal.nombre_completo} style={{ width: '100%', maxWidth: 220, borderRadius: 10 }} /> : null}
                  <h3>{tal.nombre_completo}</h3>
                  <p>{tal.edad} años · {tal.ciudad}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ESTADOS.map((st) => (
                      <button key={st} className={states[String(tal.talento_id)] === st ? 'btn-primary-small' : 'btn-secondary-small'} onClick={() => saveState(rol, tal.talento_id, st)}>{st}</button>
                    ))}
                    <button className="btn-secondary-small" onClick={() => saveState(rol, tal.talento_id, 'none')}>limpiar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!shortlist?.cliente_finalizado && <button className="btn-primary" onClick={finalizarSeleccion}>Finalizar y avisar productora</button>}
    </div></div></div>
  );
};

export default VerShortlist;
