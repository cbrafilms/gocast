import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClienteCasting = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(`${API}/cliente/casting/${token}`);
        setData(response.data);
      } catch (e) {
        setError(e.response?.data?.detail || 'No se pudo abrir el link');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const setRoleSelection = (rolNombre, field, value) => {
    setSelections(prev => ({
      ...prev,
      [rolNombre]: {
        ...prev[rolNombre],
        [field]: value
      }
    }));
  };

  const guardarSeleccion = async () => {
    setError('');
    setMessage('');

    const payload = {
      selections: Object.entries(selections).map(([rol_nombre, vals]) => ({
        rol_nombre,
        selected_talento_id: vals.selected_talento_id,
        backup_talento_id: vals.backup_talento_id
      }))
    };

    if (payload.selections.some(s => !s.selected_talento_id || !s.backup_talento_id)) {
      setError('Debes seleccionar titular y backup en todos los roles editados');
      return;
    }

    try {
      await axios.post(`${API}/cliente/casting/${token}/seleccion`, payload);
      setMessage('Selección enviada correctamente');
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al guardar selección');
    }
  };

  if (loading) return <div className="gocast-container"><p>Cargando...</p></div>;
  if (error && !data) return <div className="gocast-container"><div className="error-message">{error}</div></div>;

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <h1 className="page-title">Selección cliente</h1>
        <p className="page-subtitle">{data?.casting_titulo}</p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {(data?.roles || []).map((rol) => (
          <div key={rol.rol_nombre} className="perfil-card" style={{ marginBottom: 16 }}>
            <h3>{rol.rol_nombre}</h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Titular</label>
                <select
                  className="form-input"
                  value={selections[rol.rol_nombre]?.selected_talento_id || ''}
                  onChange={(e) => setRoleSelection(rol.rol_nombre, 'selected_talento_id', e.target.value)}
                >
                  <option value="">Selecciona talento</option>
                  {rol.talentos.map((t) => (
                    <option key={`s-${rol.rol_nombre}-${t.talento_id}`} value={t.talento_id}>
                      {t.talento_nombre || t.talento_nombre || t.talento_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Backup</label>
                <select
                  className="form-input"
                  value={selections[rol.rol_nombre]?.backup_talento_id || ''}
                  onChange={(e) => setRoleSelection(rol.rol_nombre, 'backup_talento_id', e.target.value)}
                >
                  <option value="">Selecciona talento</option>
                  {rol.talentos.map((t) => (
                    <option key={`b-${rol.rol_nombre}-${t.talento_id}`} value={t.talento_id}>
                      {t.talento_nombre || t.talento_nombre || t.talento_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        <button className="btn-primary" onClick={guardarSeleccion}>Guardar selección</button>
      </div>
    </div>
  );
};

export default ClienteCasting;
