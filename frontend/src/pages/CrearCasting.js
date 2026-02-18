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
    ubicacion: '',
    territorios: [],
    duracion_exhibicion: '',
    fecha_limite_postulacion: '',
    fecha_produccion: '',
    requisitos_generales: ''
  });
  
  const [roles, setRoles] = useState([{
    nombre_rol: '',
    descripcion_rol: '',
    tipo_talento: 'actor',
    sexo: '',
    edad_min: '',
    edad_max: '',
    altura_min: '',
    altura_max: '',
    color_pelo: '',
    color_ojos: '',
    talla_camisa: '',
    talla_pantalon: '',
    talla_zapatos: '',
    monto: ''
  }]);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [matches, setMatches] = useState({});

  const territoriosDisponibles = [
    'Argentina', 'Chile', 'Colombia', 'México', 'Perú', 
    'España', 'Estados Unidos', 'Brasil', 'Uruguay',
    'Latinoamérica', 'Europa', 'Norteamérica', 'Mundial'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTerritoriosChange = (territorio) => {
    setFormData(prev => ({
      ...prev,
      territorios: prev.territorios.includes(territorio)
        ? prev.territorios.filter(t => t !== territorio)
        : [...prev.territorios, territorio]
    }));
  };

  const handleRolChange = (index, field, value) => {
    const newRoles = [...roles];
    newRoles[index][field] = value;
    setRoles(newRoles);
  };

  const agregarRol = () => {
    setRoles([...roles, {
      nombre_rol: '',
      descripcion_rol: '',
      tipo_talento: 'actor',
      sexo: '',
      edad_min: '',
      edad_max: '',
      altura_min: '',
      altura_max: '',
      color_pelo: '',
      color_ojos: '',
      talla_camisa: '',
      talla_pantalon: '',
      talla_zapatos: '',
      monto: ''
    }]);
  };

  const eliminarRol = (index) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const buscarMatches = async (rol, index) => {
    try {
      const response = await axios.post(`${API}/auto-match`, rol, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMatches(prev => ({
        ...prev,
        [index]: response.data
      }));
    } catch (error) {
      console.error('Error al buscar matches:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) newErrors.titulo = 'El título es requerido';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (!formData.ubicacion.trim()) newErrors.ubicacion = 'La ubicación es requerida';
    if (formData.territorios.length === 0) newErrors.territorios = 'Selecciona al menos un territorio';
    
    roles.forEach((rol, index) => {
      if (!rol.nombre_rol.trim()) {
        newErrors[`rol_${index}_nombre`] = 'El nombre del rol es requerido';
      }
      if (!rol.descripcion_rol.trim()) {
        newErrors[`rol_${index}_descripcion`] = 'La descripción del rol es requerida';
      }
    });

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

    // Preparar roles con conversiones de tipos
    const rolesPreparados = roles.map(rol => ({
      ...rol,
      edad_min: rol.edad_min ? parseInt(rol.edad_min) : null,
      edad_max: rol.edad_max ? parseInt(rol.edad_max) : null,
      altura_min: rol.altura_min ? parseInt(rol.altura_min) : null,
      altura_max: rol.altura_max ? parseInt(rol.altura_max) : null,
      monto: rol.monto ? parseFloat(rol.monto) : null
    }));

    try {
      const response = await axios.post(`${API}/castings`, {
        ...formData,
        roles: rolesPreparados
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setSuccessMessage('¡Casting creado exitosamente!');
        
        // Buscar matches automáticamente para cada rol
        for (let i = 0; i < rolesPreparados.length; i++) {
          await buscarMatches(rolesPreparados[i], i);
        }
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
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
      <div className=\"gocast-page\">
        <div className=\"gocast-container\">
          <div className=\"error-message\">Solo las productoras pueden crear castings.</div>
        </div>
      </div>
    );
  }

  return (
    <div className=\"gocast-page\">
      <div className=\"gocast-container\">
        <div className=\"casting-crear-container\">
          <div className=\"registro-header\">
            <h1 className=\"page-title\" data-testid=\"create-casting-title\">Crear Nuevo Casting</h1>
            <p className=\"page-subtitle\">Publica tu casting con múltiples roles</p>
          </div>

          <form onSubmit={handleSubmit} className=\"casting-form\" data-testid=\"create-casting-form\">
            {successMessage && (
              <div className=\"success-message\" data-testid=\"success-message\">
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className=\"error-message\" data-testid=\"error-message\">
                {errors.submit}
              </div>
            )}

            {/* Información General */}
            <div className=\"perfil-card\">
              <h2 className=\"card-title\">Información General del Casting</h2>
              
              <div className=\"form-group\">
                <label htmlFor=\"titulo\" className=\"form-label\">Título del Casting *</label>
                <input
                  type=\"text\"
                  id=\"titulo\"
                  name=\"titulo\"
                  value={formData.titulo}
                  onChange={handleChange}
                  className={`form-input ${errors.titulo ? 'input-error' : ''}`}
                  placeholder=\"Ej: Casting para película familiar\"
                  data-testid=\"titulo-input\"
                />
                {errors.titulo && <span className=\"form-error\">{errors.titulo}</span>}
              </div>

              <div className=\"form-group\">
                <label htmlFor=\"descripcion\" className=\"form-label\">Descripción General *</label>
                <textarea
                  id=\"descripcion\"
                  name=\"descripcion\"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className={`form-input ${errors.descripcion ? 'input-error' : ''}`}
                  placeholder=\"Describe el proyecto, la historia, el ambiente...\"
                  rows=\"5\"
                  data-testid=\"descripcion-input\"
                />
                {errors.descripcion && <span className=\"form-error\">{errors.descripcion}</span>}
              </div>

              <div className=\"form-row\">
                <div className=\"form-group\">
                  <label htmlFor=\"ubicacion\" className=\"form-label\">Ubicación de Filmación *</label>
                  <input
                    type=\"text\"
                    id=\"ubicacion\"
                    name=\"ubicacion\"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    className={`form-input ${errors.ubicacion ? 'input-error' : ''}`}
                    placeholder=\"Ej: Buenos Aires, Argentina\"
                    data-testid=\"ubicacion-input\"
                  />
                  {errors.ubicacion && <span className=\"form-error\">{errors.ubicacion}</span>}
                </div>

                <div className=\"form-group\">
                  <label htmlFor=\"duracion_exhibicion\" className=\"form-label\">Duración de Exhibición</label>
                  <input
                    type=\"text\"
                    id=\"duracion_exhibicion\"
                    name=\"duracion_exhibicion\"
                    value={formData.duracion_exhibicion}
                    onChange={handleChange}
                    className=\"form-input\"
                    placeholder=\"Ej: 6 meses, 1 año, ilimitado\"
                  />
                </div>
              </div>

              <div className=\"form-row\">
                <div className=\"form-group\">
                  <label htmlFor=\"fecha_limite_postulacion\" className=\"form-label\">Fecha Límite para Postular</label>
                  <input
                    type=\"date\"
                    id=\"fecha_limite_postulacion\"
                    name=\"fecha_limite_postulacion\"
                    value={formData.fecha_limite_postulacion}
                    onChange={handleChange}
                    className=\"form-input\"
                  />
                </div>

                <div className=\"form-group\">
                  <label htmlFor=\"fecha_produccion\" className=\"form-label\">Fecha Tentativa de Producción</label>
                  <input
                    type=\"date\"
                    id=\"fecha_produccion\"
                    name=\"fecha_produccion\"
                    value={formData.fecha_produccion}
                    onChange={handleChange}
                    className=\"form-input\"
                  />
                </div>
              </div>

              <div className=\"form-group\">
                <label className=\"form-label\">Territorios de Exhibición *</label>
                <div className=\"territorios-grid\">
                  {territoriosDisponibles.map(territorio => (
                    <label key={territorio} className=\"checkbox-label-inline\">
                      <input
                        type=\"checkbox\"
                        checked={formData.territorios.includes(territorio)}
                        onChange={() => handleTerritoriosChange(territorio)}
                        className=\"checkbox-input\"
                      />
                      <span className=\"checkbox-text-inline\">{territorio}</span>
                    </label>
                  ))}
                </div>
                {errors.territorios && <span className=\"form-error\">{errors.territorios}</span>}
              </div>

              <div className=\"form-group\">
                <label htmlFor=\"requisitos_generales\" className=\"form-label\">Requisitos Generales</label>
                <textarea
                  id=\"requisitos_generales\"
                  name=\"requisitos_generales\"
                  value={formData.requisitos_generales}
                  onChange={handleChange}
                  className=\"form-input\"
                  rows=\"3\"
                  placeholder=\"Requisitos generales para todos los roles...\"
                />
              </div>
            </div>

            {/* Roles */}
            <div className=\"roles-section\">
              <div className=\"section-header\">
                <h2 className=\"card-title\">Roles del Casting</h2>
                <button
                  type=\"button\"
                  onClick={agregarRol}
                  className=\"btn-add-rol\"
                >
                  ➕ Agregar Rol
                </button>
              </div>

              {roles.map((rol, index) => (
                <div key={index} className=\"perfil-card rol-card\">
                  <div className=\"rol-header\">
                    <h3 className=\"rol-title\">Rol {index + 1}</h3>
                    {roles.length > 1 && (
                      <button
                        type=\"button\"
                        onClick={() => eliminarRol(index)}
                        className=\"btn-remove-rol\"
                      >
                        ❌ Eliminar
                      </button>
                    )}
                  </div>

                  <div className=\"form-row\">
                    <div className=\"form-group\">
                      <label className=\"form-label\">Nombre del Rol *</label>
                      <input
                        type=\"text\"
                        value={rol.nombre_rol}
                        onChange={(e) => handleRolChange(index, 'nombre_rol', e.target.value)}
                        className={`form-input ${errors[`rol_${index}_nombre`] ? 'input-error' : ''}`}
                        placeholder=\"Ej: Padre, Madre, Hijo\"
                      />
                      {errors[`rol_${index}_nombre`] && <span className=\"form-error\">{errors[`rol_${index}_nombre`]}</span>}
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Monto/Pago (USD)</label>
                      <input
                        type=\"number\"
                        value={rol.monto}
                        onChange={(e) => handleRolChange(index, 'monto', e.target.value)}
                        className=\"form-input\"
                        placeholder=\"500\"
                        min=\"0\"
                        step=\"0.01\"
                      />
                    </div>
                  </div>

                  <div className=\"form-group\">
                    <label className=\"form-label\">Descripción del Rol *</label>
                    <textarea
                      value={rol.descripcion_rol}
                      onChange={(e) => handleRolChange(index, 'descripcion_rol', e.target.value)}
                      className={`form-input ${errors[`rol_${index}_descripcion`] ? 'input-error' : ''}`}
                      rows=\"3\"
                      placeholder=\"Describe el personaje, su personalidad, importancia en la historia...\"
                    />
                    {errors[`rol_${index}_descripcion`] && <span className=\"form-error\">{errors[`rol_${index}_descripcion`]}</span>}
                  </div>

                  <div className=\"form-grid\">
                    <div className=\"form-group\">
                      <label className=\"form-label\">Tipo de Talento</label>
                      <select
                        value={rol.tipo_talento}
                        onChange={(e) => handleRolChange(index, 'tipo_talento', e.target.value)}
                        className=\"form-input\"
                      >
                        <option value=\"actor\">Actor/Actriz</option>
                        <option value=\"modelo\">Modelo</option>
                        <option value=\"voz\">Voz en Off</option>
                        <option value=\"extra\">Extra</option>
                        <option value=\"bailarin\">Bailarín</option>
                        <option value=\"musico\">Músico</option>
                      </select>
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Género</label>
                      <select
                        value={rol.sexo}
                        onChange={(e) => handleRolChange(index, 'sexo', e.target.value)}
                        className=\"form-input\"
                      >
                        <option value=\"\">Cualquiera</option>
                        <option value=\"masculino\">Masculino</option>
                        <option value=\"femenino\">Femenino</option>
                        <option value=\"otro\">Otro</option>
                      </select>
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Edad Mínima</label>
                      <input
                        type=\"number\"
                        value={rol.edad_min}
                        onChange={(e) => handleRolChange(index, 'edad_min', e.target.value)}
                        className=\"form-input\"
                        min=\"0\"
                        max=\"100\"
                      />
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Edad Máxima</label>
                      <input
                        type=\"number\"
                        value={rol.edad_max}
                        onChange={(e) => handleRolChange(index, 'edad_max', e.target.value)}
                        className=\"form-input\"
                        min=\"0\"
                        max=\"100\"
                      />
                    </div>
                  </div>

                  <div className=\"form-grid\">
                    <div className=\"form-group\">
                      <label className=\"form-label\">Altura Mín (cm)</label>
                      <input
                        type=\"number\"
                        value={rol.altura_min}
                        onChange={(e) => handleRolChange(index, 'altura_min', e.target.value)}
                        className=\"form-input\"
                      />
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Altura Máx (cm)</label>
                      <input
                        type=\"number\"
                        value={rol.altura_max}
                        onChange={(e) => handleRolChange(index, 'altura_max', e.target.value)}
                        className=\"form-input\"
                      />
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Color de Pelo</label>
                      <select
                        value={rol.color_pelo}
                        onChange={(e) => handleRolChange(index, 'color_pelo', e.target.value)}
                        className=\"form-input\"
                      >
                        <option value=\"\">Cualquiera</option>
                        <option value=\"negro\">Negro</option>
                        <option value=\"castaño\">Castaño</option>
                        <option value=\"rubio\">Rubio</option>
                        <option value=\"pelirrojo\">Pelirrojo</option>
                        <option value=\"gris\">Gris/Canoso</option>
                      </select>
                    </div>

                    <div className=\"form-group\">
                      <label className=\"form-label\">Color de Ojos</label>
                      <select
                        value={rol.color_ojos}
                        onChange={(e) => handleRolChange(index, 'color_ojos', e.target.value)}
                        className=\"form-input\"
                      >
                        <option value=\"\">Cualquiera</option>
                        <option value=\"marrones\">Marrones</option>
                        <option value=\"verdes\">Verdes</option>
                        <option value=\"azules\">Azules</option>
                        <option value=\"grises\">Grises</option>
                        <option value=\"negros\">Negros</option>
                      </select>
                    </div>
                  </div>

                  {matches[index] && (
                    <div className=\"matches-section\">
                      <h4 className=\"matches-title\">
                        🎯 {matches[index].total_matches} talentos coinciden con este rol
                      </h4>
                      {matches[index].total_matches > 0 && (
                        <p className=\"matches-text\">
                          Podrás invitarlos desde el dashboard después de crear el casting.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button 
              type=\"submit\" 
              className=\"btn-submit-large\" 
              disabled={isSubmitting}
              data-testid=\"submit-btn\"
            >
              {isSubmitting ? 'Creando Casting y Buscando Matches...' : 'Publicar Casting'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearCasting;
