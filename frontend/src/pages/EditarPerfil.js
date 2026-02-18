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

    if (!formData.nombre_completo.trim()) newErrors.nombre_completo = 'El nombre es requerido';
    if (!formData.edad || formData.edad < 1) newErrors.edad = 'La edad es requerida';
    if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida';
    if (!formData.pais.trim()) newErrors.pais = 'El país es requerido';
    if (!formData.altura_cm || formData.altura_cm < 1) newErrors.altura_cm = 'La altura es requerida';
    if (!formData.descripcion_corta.trim()) newErrors.descripcion_corta = 'La descripción es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        <div className="perfil-container">
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
          
          <div className="perfil-header">
            <h1 className="page-title">Editar Perfil de Talento</h1>
            <p className="page-subtitle">Actualiza tu información</p>
          </div>

          <form onSubmit={handleSubmit} className="perfil-form">
            {successMessage && <div className="success-message">{successMessage}</div>}
            {errors.submit && <div className="error-message">{errors.submit}</div>}

            {/* Mismo formulario que CompletarPerfil */}
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

            <div className="perfil-card">
              <h2 className="card-title">Información Personal</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className={`form-input ${errors.nombre_completo ? 'input-error' : ''}`} />
                  {errors.nombre_completo && <span className="form-error">{errors.nombre_completo}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Edad *</label>
                  <input type="number" name="edad" value={formData.edad} onChange={handleChange} className={`form-input ${errors.edad ? 'input-error' : ''}`} />
                  {errors.edad && <span className="form-error">{errors.edad}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad *</label>
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className={`form-input ${errors.ciudad ? 'input-error' : ''}`} />
                  {errors.ciudad && <span className="form-error">{errors.ciudad}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">País *</label>
                  <input type="text" name="pais" value={formData.pais} onChange={handleChange} className={`form-input ${errors.pais ? 'input-error' : ''}`} />
                  {errors.pais && <span className="form-error">{errors.pais}</span>}
                </div>
              </div>
            </div>

            <div className="perfil-card">
              <h2 className="card-title">Descripción</h2>
              <div className="form-group">
                <label className="form-label">Descripción Breve *</label>
                <textarea name="descripcion_corta" value={formData.descripcion_corta} onChange={handleChange} className={`form-input ${errors.descripcion_corta ? 'input-error' : ''}`} rows="4" />
                {errors.descripcion_corta && <span className="form-error">{errors.descripcion_corta}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Talentos Especiales</label>
                <textarea name="talentos_especiales" value={formData.talentos_especiales} onChange={handleChange} className="form-input" rows="3" />
              </div>
            </div>

            <button type="submit" className="btn-submit-large" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar Perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarPerfil;