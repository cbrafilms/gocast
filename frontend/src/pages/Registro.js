import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Registro = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('talento'); // 'talento' o 'productora'
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.aceptaTerminos) {
      newErrors.aceptaTerminos = 'Debes aceptar los términos y condiciones';
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
      const response = await axios.post(`${API}/register`, {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        tipo_usuario: userType,
        acepta_terminos: formData.aceptaTerminos
      });

      if (response.data) {
        setSuccessMessage('¡Registro exitoso! Bienvenido a GOCAST.me');
        // Limpiar formulario
        setFormData({
          nombre: '',
          email: '',
          password: '',
          confirmPassword: '',
          aceptaTerminos: false
        });
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al registrar:', error);
      setErrors({ 
        submit: error.response?.data?.detail || 'Error al registrar. Por favor, intenta nuevamente.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="registro-container">
          <div className="registro-header">
            <h1 className="page-title" data-testid="register-title">Crear Cuenta</h1>
            <p className="page-subtitle">Únete a GOCAST.me y comienza tu experiencia</p>
          </div>

          {/* Selector de tipo de usuario */}
          <div className="user-type-selector" data-testid="user-type-selector">
            <button
              type="button"
              className={`user-type-btn ${userType === 'talento' ? 'active' : ''}`}
              onClick={() => setUserType('talento')}
              data-testid="talent-type-btn"
            >
              🎭 Soy Talento
            </button>
            <button
              type="button"
              className={`user-type-btn ${userType === 'productora' ? 'active' : ''}`}
              onClick={() => setUserType('productora')}
              data-testid="producer-type-btn"
            >
              🎬 Soy Productora/Agencia
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="registro-form" data-testid="register-form">
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
              <label htmlFor="nombre" className="form-label">
                Nombre {userType === 'productora' ? 'de la Productora/Agencia' : 'Completo'}
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`form-input ${errors.nombre ? 'input-error' : ''}`}
                placeholder={userType === 'productora' ? 'Ej: Productora Audiovisual ABC' : 'Ej: Juan Pérez'}
                data-testid="name-input"
              />
              {errors.nombre && <span className="form-error" data-testid="name-error">{errors.nombre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="tu@email.com"
                data-testid="email-input"
              />
              {errors.email && <span className="form-error" data-testid="email-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                data-testid="password-input"
              />
              {errors.password && <span className="form-error" data-testid="password-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repite tu contraseña"
                data-testid="confirm-password-input"
              />
              {errors.confirmPassword && <span className="form-error" data-testid="confirm-password-error">{errors.confirmPassword}</span>}
            </div>

            {/* Checkbox de términos */}
            <div className="form-group-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={formData.aceptaTerminos}
                  onChange={handleChange}
                  className="checkbox-input"
                  data-testid="terms-checkbox"
                />
                <span className="checkbox-text">
                  He leído y acepto las{' '}
                  <Link to="/legales" target="_blank" className="terms-link" data-testid="terms-link">
                    condiciones y políticas de GOCAST.me
                  </Link>
                </span>
              </label>
              {errors.aceptaTerminos && (
                <span className="form-error" data-testid="terms-error">{errors.aceptaTerminos}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isSubmitting}
              data-testid="submit-btn"
            >
              {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="registro-footer">
            <p className="footer-text">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/" className="footer-link">Iniciar Sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;