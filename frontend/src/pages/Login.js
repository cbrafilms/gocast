import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
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

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Si es talento y no tiene perfil completo, redirigir a completar perfil
        if (result.user && result.user.tipo_usuario === 'talento' && !result.user.perfil_completo) {
          navigate('/completar-perfil');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setErrors({ submit: 'Error inesperado. Por favor, intenta nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="registro-container">
          <div className="registro-header">
            <h1 className="page-title" data-testid="login-title">Iniciar Sesión</h1>
            <p className="page-subtitle">Accede a tu cuenta de GOCAST.me</p>
          </div>

          <form onSubmit={handleSubmit} className="registro-form" data-testid="login-form">
            {errors.submit && (
              <div className="error-message" data-testid="error-message">
                {errors.submit}
              </div>
            )}

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
              {errors.email && <span className="form-error">{errors.email}</span>}
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
                placeholder="Tu contraseña"
                data-testid="password-input"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isSubmitting}
              data-testid="submit-btn"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="registro-footer">
            <p className="footer-text">
              ¿No tienes una cuenta?{' '}
              <Link to="/registro" className="footer-link">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;