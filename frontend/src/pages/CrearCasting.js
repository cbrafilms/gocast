import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CrearCasting = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'actor',
    genero: '',
    edad_min: '',
    edad_max: '',
    requisitos: '',
    ubicacion: '',
    fecha_limite: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida';
    }

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
      const response = await axios.post(`${API}/castings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setSuccessMessage('¡Casting creado exitosamente!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al crear casting:', error);
      setErrors({ 
        submit: error.response?.data?.detail || 'Error al crear el casting. Por favor, intenta nuevamente.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.tipo_usuario !== 'productora') {
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="error-message">Solo las productoras pueden crear castings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="registro-container" style={{maxWidth: '800px'}}>
          <div className="registro-header">
            <h1 className="page-title" data-testid="create-casting-title">Crear Nuevo Casting</h1>
            <p className="page-subtitle">Publica tu casting y encuentra el talento perfecto</p>
          </div>

          <form onSubmit={handleSubmit} className="registro-form" data-testid="create-casting-form">
            {successMessage && (
              <div className="success-message" data-testid="success-message">
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="error-message" data-testid="error-message">
                {errors.submit}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="titulo" className="form-label">Título del Casting *</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className={`form-input ${errors.titulo ? 'input-error' : ''}`}
                placeholder="Ej: Se busca actor principal para película"
                data-testid="titulo-input"
              />
              {errors.titulo && <span className="form-error">{errors.titulo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="descripcion" className="form-label">Descripción *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className={`form-input ${errors.descripcion ? 'input-error' : ''}`}
                placeholder="Describe el proyecto, el personaje, y lo que buscas..."
                rows="5"
                data-testid="descripcion-input"
              />
              {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo" className="form-label">Tipo de Talento</label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="form-input"
                  data-testid="tipo-input"
                >
                  <option value="actor">Actor/Actriz</option>
                  <option value="modelo">Modelo</option>
                  <option value="extra">Extra/Figurante</option>
                  <option value="voz">Locutor/Voz</option>
                  <option value="bailarin">Bailarín/Bailarina</option>
                  <option value="musico">Músico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="genero" className="form-label">Género</label>
                <select
                  id="genero"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className="form-input"
                  data-testid="genero-input"
                >
                  <option value="">Cualquiera</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="no-binario">No binario</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edad_min" className="form-label">Edad Mínima</label>
                <input
                  type="number"
                  id="edad_min"
                  name="edad_min"
                  value={formData.edad_min}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: 18"
                  min="0"
                  max="100"
                  data-testid="edad-min-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edad_max" className="form-label">Edad Máxima</label>
                <input
                  type="number"
                  id="edad_max"
                  name="edad_max"
                  value={formData.edad_max}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: 35"
                  min="0"
                  max="100"
                  data-testid="edad-max-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="requisitos" className="form-label">Requisitos Adicionales</label>
              <textarea
                id="requisitos"
                name="requisitos"
                value={formData.requisitos}
                onChange={handleChange}
                className="form-input"
                placeholder="Experiencia previa, habilidades especiales, disponibilidad, etc."
                rows="3"
                data-testid="requisitos-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ubicacion" className="form-label">Ubicación *</label>
                <input
                  type="text"
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className={`form-input ${errors.ubicacion ? 'input-error' : ''}`}
                  placeholder="Ej: Buenos Aires, Argentina"
                  data-testid="ubicacion-input"
                />
                {errors.ubicacion && <span className="form-error">{errors.ubicacion}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fecha_limite" className="form-label">Fecha Límite</label>
                <input
                  type="date"
                  id="fecha_limite"
                  name="fecha_limite"
                  value={formData.fecha_limite}
                  onChange={handleChange}
                  className="form-input"
                  data-testid="fecha-limite-input"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isSubmitting}
              data-testid="submit-btn"
            >
              {isSubmitting ? 'Creando Casting...' : 'Publicar Casting'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearCasting;