import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  const [formData, setFormData] = useState({
    tipo_talento: 'actor',
    nombre_completo: '',
    edad: '',
    ciudad: '',
    pais: '',
    altura_cm: '',
    color_pelo: 'castaño',
    color_ojos: 'marrones',
    sexo: 'masculino',
    talla_camisa: 'M',
    talla_pantalon: '',
    talla_zapatos: '',
    descripcion_corta: '',
    talentos_especiales: '',
    disponibilidad: [],
    fotos: [],
    videos: []
  });
  
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fotoInput, setFotoInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (!user || user.tipo_usuario !== 'talento') {
      navigate('/dashboard');
      return;
    }
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const response = await axios.get(`${API}/perfil-talento`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(response.data);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'disponibilidad') {
      setFormData(prev => ({
        ...prev,
        disponibilidad: checked 
          ? [...prev.disponibilidad, value]
          : prev.disponibilidad.filter(d => d !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre_completo?.trim()) newErrors.nombre_completo = 'El nombre es requerido';
    if (!formData.edad || formData.edad < 1) newErrors.edad = 'La edad es requerida';
    if (!formData.ciudad?.trim()) newErrors.ciudad = 'La ciudad es requerida';
    if (!formData.pais?.trim()) newErrors.pais = 'El país es requerido';
    if (!formData.altura_cm || formData.altura_cm < 1) newErrors.altura_cm = 'La altura es requerida';
    if (!formData.talla_pantalon?.trim()) newErrors.talla_pantalon = 'La talla de pantalón es requerida';
    if (!formData.talla_zapatos?.trim()) newErrors.talla_zapatos = 'La talla de zapatos es requerida';
    if (!formData.descripcion_corta?.trim()) newErrors.descripcion_corta = 'La descripción es requerida';
    if (!formData.disponibilidad || formData.disponibilidad.length === 0) newErrors.disponibilidad = 'Selecciona al menos un día';
    if ((formData.fotos || []).length < 1) newErrors.fotos = 'Debes mantener al menos 1 foto';
    if ((formData.videos || []).length < 1) newErrors.videos = 'Debes mantener al menos 1 video';
    if ((formData.fotos || []).length > 5) newErrors.fotos = 'Máximo 5 fotos';
    if ((formData.videos || []).length > 1) newErrors.videos = 'Máximo 1 video';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addFoto = () => {
    const url = fotoInput.trim();
    if (!url || (formData.fotos || []).length >= 5) return;
    setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), url] }));
    setFotoInput('');
  };

  const removeFoto = (idx) => {
    setFormData(prev => ({ ...prev, fotos: (prev.fotos || []).filter((_, i) => i !== idx) }));
  };

  const setFotoPrincipal = (idx) => {
    setFormData(prev => {
      const fotos = [...(prev.fotos || [])];
      if (idx < 0 || idx >= fotos.length) return prev;
      const [principal] = fotos.splice(idx, 1);
      return { ...prev, fotos: [principal, ...fotos] };
    });
  };

  const addVideo = () => {
    const url = videoInput.trim();
    if (!url) return;
    setFormData(prev => ({ ...prev, videos: [url] }));
    setVideoInput('');
  };

  const removeVideo = () => setFormData(prev => ({ ...prev, videos: [] }));

  const uploadMediaFile = async (file, kind) => {
    const data = new FormData();
    data.append('kind', kind);
    data.append('file', file);

    const response = await axios.post(`${API}/upload-media`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response?.data?.url;
  };

  const handleFotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if ((formData.fotos || []).length >= 5) {
      setErrors(prev => ({ ...prev, fotos: 'Máximo 5 fotos' }));
      return;
    }

    try {
      setUploadingFoto(true);
      const url = await uploadMediaFile(file, 'foto');
      setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), url] }));
      setErrors(prev => ({ ...prev, fotos: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, fotos: error.response?.data?.detail || 'Error al subir foto' }));
    } finally {
      setUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      const url = await uploadMediaFile(file, 'video');
      setFormData(prev => ({ ...prev, videos: [url] }));
      setErrors(prev => ({ ...prev, videos: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, videos: error.response?.data?.detail || 'Error al subir video' }));
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await axios.post(`${API}/perfil-talento`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('¡Perfil actualizado exitosamente!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setErrors({ 
        submit: error.response?.data?.detail || 'Error al actualizar perfil' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="perfil-container" data-testid="editar-perfil">
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
          
          <div className="perfil-header">
            <h1 className="page-title">Editar Perfil de Talento</h1>
            <p className="page-subtitle">Actualiza tu información para mejorar tus oportunidades</p>
          </div>

          <form onSubmit={handleSubmit} className="perfil-form">
            {successMessage && <div className="success-message">{successMessage}</div>}
            {errors.submit && <div className="error-message">{errors.submit}</div>}

            {/* Tipo de Talento */}
            <div className="perfil-card">
              <h2 className="card-title">Tipo de Talento</h2>
              <div className="form-group">
                <select name="tipo_talento" value={formData.tipo_talento || 'actor'} onChange={handleChange} className="form-input">
                  <option value="actor">Actor/Actriz</option>
                  <option value="modelo">Modelo</option>
                  <option value="voz">Voz en Off/Locutor</option>
                  <option value="extra">Extra/Figurante</option>
                  <option value="bailarin">Bailarín/Bailarina</option>
                  <option value="musico">Músico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Información Personal */}
            <div className="perfil-card">
              <h2 className="card-title">Información Personal</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input type="text" name="nombre_completo" value={formData.nombre_completo || ''} onChange={handleChange} className={`form-input ${errors.nombre_completo ? 'input-error' : ''}`} placeholder="Ej: Juan Pérez" />
                  {errors.nombre_completo && <span className="form-error">{errors.nombre_completo}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Edad *</label>
                  <input type="number" name="edad" value={formData.edad || ''} onChange={handleChange} className={`form-input ${errors.edad ? 'input-error' : ''}`} min="1" max="100" />
                  {errors.edad && <span className="form-error">{errors.edad}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad *</label>
                  <input type="text" name="ciudad" value={formData.ciudad || ''} onChange={handleChange} className={`form-input ${errors.ciudad ? 'input-error' : ''}`} placeholder="Ej: Buenos Aires" />
                  {errors.ciudad && <span className="form-error">{errors.ciudad}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">País *</label>
                  <input type="text" name="pais" value={formData.pais || ''} onChange={handleChange} className={`form-input ${errors.pais ? 'input-error' : ''}`} placeholder="Ej: Argentina" />
                  {errors.pais && <span className="form-error">{errors.pais}</span>}
                </div>
              </div>
            </div>

            {/* Atributos Físicos */}
            <div className="perfil-card">
              <h2 className="card-title">Atributos Físicos</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Altura (cm) *</label>
                  <input type="number" name="altura_cm" value={formData.altura_cm || ''} onChange={handleChange} className={`form-input ${errors.altura_cm ? 'input-error' : ''}`} min="1" max="250" />
                  {errors.altura_cm && <span className="form-error">{errors.altura_cm}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Color de Pelo *</label>
                  <select name="color_pelo" value={formData.color_pelo || 'castaño'} onChange={handleChange} className="form-input">
                    <option value="negro">Negro</option>
                    <option value="castaño">Castaño</option>
                    <option value="rubio">Rubio</option>
                    <option value="pelirrojo">Pelirrojo</option>
                    <option value="gris">Gris/Canoso</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Color de Ojos *</label>
                  <select name="color_ojos" value={formData.color_ojos || 'marrones'} onChange={handleChange} className="form-input">
                    <option value="marrones">Marrones</option>
                    <option value="verdes">Verdes</option>
                    <option value="azules">Azules</option>
                    <option value="grises">Grises</option>
                    <option value="negros">Negros</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sexo *</label>
                  <select name="sexo" value={formData.sexo || 'masculino'} onChange={handleChange} className="form-input">
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tallas */}
            <div className="perfil-card">
              <h2 className="card-title">Tallas</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Talla Camisa *</label>
                  <select name="talla_camisa" value={formData.talla_camisa || 'M'} onChange={handleChange} className="form-input">
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Talla Pantalón *</label>
                  <input type="text" name="talla_pantalon" value={formData.talla_pantalon || ''} onChange={handleChange} className={`form-input ${errors.talla_pantalon ? 'input-error' : ''}`} placeholder="Ej: 32" />
                  {errors.talla_pantalon && <span className="form-error">{errors.talla_pantalon}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Talla Zapatos *</label>
                  <input type="text" name="talla_zapatos" value={formData.talla_zapatos || ''} onChange={handleChange} className={`form-input ${errors.talla_zapatos ? 'input-error' : ''}`} placeholder="Ej: 42" />
                  {errors.talla_zapatos && <span className="form-error">{errors.talla_zapatos}</span>}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="perfil-card">
              <h2 className="card-title">Descripción y Talentos</h2>
              <div className="form-group">
                <label className="form-label">Descripción Breve *</label>
                <textarea name="descripcion_corta" value={formData.descripcion_corta || ''} onChange={handleChange} className={`form-input ${errors.descripcion_corta ? 'input-error' : ''}`} rows="4" placeholder="Cuéntanos sobre ti, tu experiencia y qué te hace único..." />
                {errors.descripcion_corta && <span className="form-error">{errors.descripcion_corta}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Talentos Especiales</label>
                <textarea name="talentos_especiales" value={formData.talentos_especiales || ''} onChange={handleChange} className="form-input" rows="3" placeholder="Habilidades especiales: canto, baile, artes marciales, idiomas, etc." />
              </div>
            </div>

            {/* Disponibilidad */}
            <div className="perfil-card">
              <h2 className="card-title">Disponibilidad Semanal *</h2>
              <div className="disponibilidad-grid">
                {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(dia => (
                  <label key={dia} className="checkbox-label-inline">
                    <input 
                      type="checkbox" 
                      name="disponibilidad" 
                      value={dia} 
                      checked={formData.disponibilidad?.includes(dia) || false} 
                      onChange={handleChange} 
                      className="checkbox-input" 
                    />
                    <span className="checkbox-text-inline">{dia.charAt(0).toUpperCase() + dia.slice(1)}</span>
                  </label>
                ))}
              </div>
              {errors.disponibilidad && <span className="form-error">{errors.disponibilidad}</span>}
            </div>

            <div className="perfil-card">
              <h2 className="card-title">Media</h2>
              <p className="info-text">Min 1 foto + 1 video | Max 5 fotos + 1 video</p>

              <div className="form-group">
                <label className="form-label">Fotos (archivo o URL)</label>
                <div className="form-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFotoFile} className="form-input" style={{ maxWidth: 320 }} />
                  {uploadingFoto && <span className="info-text">Subiendo foto...</span>}
                  <input className="form-input" value={fotoInput} onChange={(e) => setFotoInput(e.target.value)} placeholder="https://..." />
                  <button type="button" className="btn-secondary" onClick={addFoto}>Agregar URL</button>
                </div>
                {errors.fotos && <span className="form-error">{errors.fotos}</span>}
                <ul>
                  {(formData.fotos || []).map((f, idx) => (
                    <li key={`${f}-${idx}`}>
                      {idx === 0 ? '🌟 ' : ''}{f}
                      <button type="button" className="btn-secondary-small" onClick={() => setFotoPrincipal(idx)} style={{ marginLeft: 8 }}>Principal</button>
                      <button type="button" className="btn-secondary-small" onClick={() => removeFoto(idx)} style={{ marginLeft: 8 }}>Eliminar</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-group">
                <label className="form-label">Video interno (archivo o URL)</label>
                <div className="form-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoFile} className="form-input" style={{ maxWidth: 320 }} />
                  {uploadingVideo && <span className="info-text">Subiendo video...</span>}
                  <input className="form-input" value={videoInput} onChange={(e) => setVideoInput(e.target.value)} placeholder="https://..." />
                  <button type="button" className="btn-secondary" onClick={addVideo}>Guardar URL</button>
                  <button type="button" className="btn-secondary" onClick={removeVideo}>Quitar</button>
                </div>
                {errors.videos && <span className="form-error">{errors.videos}</span>}
                <ul>{(formData.videos || []).map((v, idx) => <li key={`${v}-${idx}`}>{v}</li>)}</ul>
              </div>
            </div>

            <button type="submit" className="btn-submit-large" disabled={isSubmitting || uploadingFoto || uploadingVideo} data-testid="btn-actualizar">
              {isSubmitting ? 'Actualizando...' : 'Actualizar Perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarPerfil;