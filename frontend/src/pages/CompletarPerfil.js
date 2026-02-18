import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CompletarPerfil = () => {
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
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.nombre_completo.trim()) newErrors.nombre_completo = 'El nombre es requerido';
    if (!formData.edad || formData.edad < 1) newErrors.edad = 'La edad es requerida';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    if (!formData.pais.trim()) newErrors.pais = 'El país es requerido';
    if (!formData.altura_cm || formData.altura_cm < 1) newErrors.altura_cm = 'La altura es requerida';
    if (!formData.talla_pantalon.trim()) newErrors.talla_pantalon = 'La talla de pantalón es requerida';
    if (!formData.talla_zapatos.trim()) newErrors.talla_zapatos = 'La talla de zapatos es requerida';
    if (!formData.descripcion_corta.trim()) newErrors.descripcion_corta = 'La descripción es requerida';
    if (formData.disponibilidad.length === 0) newErrors.disponibilidad = 'Selecciona al menos un día';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/perfil-talento`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error al crear perfil:', error);
      setErrors({ 
        submit: error.response?.data?.detail || 'Error al crear perfil' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.tipo_usuario !== 'talento') {
    return <div className="gocast-page"><div className="gocast-container"><p>Solo los talentos pueden completar este perfil.</p></div></div>;
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="perfil-container">
          <div className="perfil-header">
            <h1 className="page-title">Completar Perfil de Talento</h1>
            <p className="page-subtitle">Por favor completa todos los campos para activar tu perfil</p>
          </div>

          <form onSubmit={handleSubmit} className="perfil-form">
            {errors.submit && <div className="error-message">{errors.submit}</div>}

            {/* Tipo de Talento */}
            <div className="perfil-card">
              <h2 className="card-title">Tipo de Talento</h2>
              <div className="form-group">
                <select name="tipo_talento" value={formData.tipo_talento} onChange={handleChange} className="form-input">
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
                  <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className={`form-input ${errors.nombre_completo ? 'input-error' : ''}`} placeholder="Ej: Juan Pérez" />
                  {errors.nombre_completo && <span className="form-error">{errors.nombre_completo}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Edad *</label>
                  <input type="number" name="edad" value={formData.edad} onChange={handleChange} className={`form-input ${errors.edad ? 'input-error' : ''}`} min="1" max="100" />
                  {errors.edad && <span className="form-error">{errors.edad}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Ciudad *</label>
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className={`form-input ${errors.ciudad ? 'input-error' : ''}`} placeholder="Ej: Buenos Aires" />
                  {errors.ciudad && <span className="form-error">{errors.ciudad}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">País *</label>
                  <input type="text" name="pais" value={formData.pais} onChange={handleChange} className={`form-input ${errors.pais ? 'input-error' : ''}`} placeholder="Ej: Argentina" />
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
                  <input type="number" name="altura_cm" value={formData.altura_cm} onChange={handleChange} className={`form-input ${errors.altura_cm ? 'input-error' : ''}`} min="1" max="250" />
                  {errors.altura_cm && <span className="form-error">{errors.altura_cm}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Color de Pelo *</label>
                  <select name="color_pelo" value={formData.color_pelo} onChange={handleChange} className="form-input">
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
                  <select name="color_ojos" value={formData.color_ojos} onChange={handleChange} className="form-input">
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
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-input">
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
                  <select name="talla_camisa" value={formData.talla_camisa} onChange={handleChange} className="form-input">
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
                  <input type="text" name="talla_pantalon" value={formData.talla_pantalon} onChange={handleChange} className={`form-input ${errors.talla_pantalon ? 'input-error' : ''}`} placeholder="Ej: 32" />
                  {errors.talla_pantalon && <span className="form-error">{errors.talla_pantalon}</span>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Talla Zapatos *</label>
                  <input type="text" name="talla_zapatos" value={formData.talla_zapatos} onChange={handleChange} className={`form-input ${errors.talla_zapatos ? 'input-error' : ''}`} placeholder="Ej: 42" />
                  {errors.talla_zapatos && <span className="form-error">{errors.talla_zapatos}</span>}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="perfil-card">
              <h2 className="card-title">Descripción y Talentos</h2>
              <div className="form-group">
                <label className="form-label">Descripción Breve *</label>
                <textarea name="descripcion_corta" value={formData.descripcion_corta} onChange={handleChange} className={`form-input ${errors.descripcion_corta ? 'input-error' : ''}`} rows="4" placeholder="Cuéntanos sobre ti, tu experiencia y qué te hace único..." />
                {errors.descripcion_corta && <span className="form-error">{errors.descripcion_corta}</span>}
              </div>
              
              <div className="form-group">
                <label className="form-label">Talentos Especiales</label>
                <textarea name="talentos_especiales" value={formData.talentos_especiales} onChange={handleChange} className="form-input" rows="3" placeholder="Habilidades especiales: canto, baile, artes marciales, idiomas, etc." />
              </div>
            </div>

            {/* Disponibilidad */}
            <div className="perfil-card">
              <h2 className="card-title">Disponibilidad Semanal *</h2>
              <div className="disponibilidad-grid">
                {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(dia => (
                  <label key={dia} className="checkbox-label-inline">
                    <input type="checkbox" name="disponibilidad" value={dia} checked={formData.disponibilidad.includes(dia)} onChange={handleChange} className="checkbox-input" />
                    <span className="checkbox-text-inline">{dia.charAt(0).toUpperCase() + dia.slice(1)}</span>
                  </label>
                ))}
              </div>
              {errors.disponibilidad && <span className="form-error">{errors.disponibilidad}</span>}
            </div>

            {/* Multimedia */}
            <div className="perfil-card">
              <h2 className="card-title">Multimedia</h2>
              <div className="multimedia-info">
                <p className="info-text">📸 Debes subir al menos <strong>1 foto</strong> y <strong>1 video</strong> de presentación.</p>
                <p className="info-text-small">La funcionalidad de subida de archivos se implementará en la próxima fase. Por ahora, el perfil se guardará con esta información.</p>
              </div>
            </div>

            <button type="submit" className="btn-submit-large" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando Perfil...' : 'Completar Perfil y Continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompletarPerfil;
