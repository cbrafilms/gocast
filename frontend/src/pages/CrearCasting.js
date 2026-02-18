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
  const [showMatches, setShowMatches] = useState(false);
  const [castingCreado, setCastingCreado] = useState(null);

  const territoriosDisponibles = [
    'Argentina', 'Chile', 'Colombia', 'Mexico', 'Peru', 
    'Espana', 'Estados Unidos', 'Brasil', 'Uruguay',
    'Latinoamerica', 'Europa', 'Norteamerica', 'Mundial'
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

  const buscarMatchesParaRol = async (rol, index) => {
    try {
      const response = await axios.post(`${API}/auto-match`, rol, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { index, data: response.data };
    } catch (error) {
      console.error('Error al buscar matches:', error);
      return { index, data: { total_matches: 0, talentos: [] } };
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'El titulo es requerido';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripcion es requerida';
    if (!formData.ubicacion.trim()) newErrors.ubicacion = 'La ubicacion es requerida';
    if (formData.territorios.length === 0) newErrors.territorios = 'Selecciona al menos un territorio';
    
    roles.forEach((rol, index) => {
      if (!rol.nombre_rol.trim()) {
        newErrors[`rol_${index}_nombre`] = 'El nombre del rol es requerido';
      }
      if (!rol.descripcion_rol.trim()) {
        newErrors[`rol_${index}_descripcion`] = 'La descripcion del rol es requerida';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

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
        setCastingCreado(response.data);
        setSuccessMessage('Casting creado exitosamente! Buscando talentos coincidentes...');
        
        // Buscar matches para cada rol
        const matchResults = await Promise.all(
          rolesPreparados.map((rol, i) => buscarMatchesParaRol(rol, i))
        );
        
        const newMatches = {};
        matchResults.forEach(result => {
          newMatches[result.index] = result.data;
        });
        setMatches(newMatches);
        setShowMatches(true);
      }
    } catch (error) {
      console.error('Error al crear casting:', error);
      setErrors({ 
        submit: error.response?.data?.detail || 'Error al crear el casting' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvitarTalento = async (talentoId, rolNombre) => {
    if (!castingCreado) return;
    
    try {
      await axios.post(`${API}/invitaciones`, {
        casting_id: castingCreado.id,
        rol_nombre: rolNombre,
        talento_id: talentoId,
        mensaje: `Te invitamos al casting "${castingCreado.titulo}"`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Invitacion enviada exitosamente!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error al enviar invitacion');
    }
  };

  const irAlDashboard = () => {
    navigate('/dashboard');
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

  // Mostrar resultados de matches
  if (showMatches && castingCreado) {
    const totalTalentos = Object.values(matches).reduce((sum, m) => sum + (m.total_matches || 0), 0);
    
    return (
      <div className="gocast-page">
        <div className="gocast-container">
          <div className="casting-crear-container">
            <div className="success-card">
              <h1 className="page-title">Casting Creado Exitosamente!</h1>
              <p className="success-subtitle">"{castingCreado.titulo}"</p>
              
              <div className="matches-summary">
                <h2 className="section-title">Talentos Coincidentes Encontrados</h2>
                <p className="matches-total">{totalTalentos} talento(s) coinciden con los requisitos de tus roles</p>
              </div>

              {roles.map((rol, index) => (
                <div key={index} className="matches-rol-section">
                  <h3 className="rol-matches-title">
                    Rol: {rol.nombre_rol} 
                    <span className="matches-count">({matches[index]?.total_matches || 0} coincidencias)</span>
                  </h3>
                  
                  {matches[index]?.talentos && matches[index].talentos.length > 0 ? (
                    <div className="talentos-matches-grid">
                      {matches[index].talentos.slice(0, 6).map((talento) => (
                        <div key={talento.user_id} className="talento-match-card">
                          <div className="talento-avatar-small">
                            {talento.nombre_completo?.charAt(0) || '?'}
                          </div>
                          <div className="talento-match-info">
                            <h4>{talento.nombre_completo}</h4>
                            <p>{talento.edad} años - {talento.ciudad}</p>
                            <p className="talento-tipo-small">{talento.tipo_talento}</p>
                          </div>
                          <button 
                            onClick={() => handleInvitarTalento(talento.user_id, rol.nombre_rol)}
                            className="btn-invite-small"
                          >
                            Invitar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-matches">No se encontraron talentos que coincidan con este rol</p>
                  )}
                </div>
              ))}

              <div className="actions-bottom">
                <button onClick={irAlDashboard} className="btn-primary">
                  Ir al Dashboard
                </button>
                <button onClick={() => navigate('/buscar-talentos')} className="btn-secondary">
                  Buscar Mas Talentos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="casting-crear-container">
          <div className="registro-header">
            <h1 className="page-title" data-testid="create-casting-title">Crear Nuevo Casting</h1>
            <p className="page-subtitle">Publica tu casting con multiples roles</p>
          </div>

          <form onSubmit={handleSubmit} className="casting-form" data-testid="create-casting-form">
            {errors.submit && (
              <div className="error-message" data-testid="error-message">{errors.submit}</div>
            )}

            <div className="perfil-card">
              <h2 className="card-title">Informacion General del Casting</h2>
              
              <div className="form-group">
                <label htmlFor="titulo" className="form-label">Titulo del Casting *</label>
                <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} className={`form-input ${errors.titulo ? 'input-error' : ''}`} placeholder="Ej: Casting para pelicula familiar" data-testid="titulo-input" />
                {errors.titulo && <span className="form-error">{errors.titulo}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="descripcion" className="form-label">Descripcion General *</label>
                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} className={`form-input ${errors.descripcion ? 'input-error' : ''}`} placeholder="Describe el proyecto, la historia, el ambiente..." rows="5" data-testid="descripcion-input" />
                {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ubicacion" className="form-label">Ubicacion de Filmacion *</label>
                  <input type="text" id="ubicacion" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className={`form-input ${errors.ubicacion ? 'input-error' : ''}`} placeholder="Ej: Buenos Aires, Argentina" data-testid="ubicacion-input" />
                  {errors.ubicacion && <span className="form-error">{errors.ubicacion}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="duracion_exhibicion" className="form-label">Duracion de Exhibicion</label>
                  <input type="text" id="duracion_exhibicion" name="duracion_exhibicion" value={formData.duracion_exhibicion} onChange={handleChange} className="form-input" placeholder="Ej: 6 meses, 1 ano, ilimitado" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fecha_limite_postulacion" className="form-label">Fecha Limite para Postular</label>
                  <input type="date" id="fecha_limite_postulacion" name="fecha_limite_postulacion" value={formData.fecha_limite_postulacion} onChange={handleChange} className="form-input" />
                </div>

                <div className="form-group">
                  <label htmlFor="fecha_produccion" className="form-label">Fecha Tentativa de Produccion</label>
                  <input type="date" id="fecha_produccion" name="fecha_produccion" value={formData.fecha_produccion} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Territorios de Exhibicion *</label>
                <div className="territorios-grid">
                  {territoriosDisponibles.map(territorio => (
                    <label key={territorio} className="checkbox-label-inline">
                      <input type="checkbox" checked={formData.territorios.includes(territorio)} onChange={() => handleTerritoriosChange(territorio)} className="checkbox-input" />
                      <span className="checkbox-text-inline">{territorio}</span>
                    </label>
                  ))}
                </div>
                {errors.territorios && <span className="form-error">{errors.territorios}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="requisitos_generales" className="form-label">Requisitos Generales</label>
                <textarea id="requisitos_generales" name="requisitos_generales" value={formData.requisitos_generales} onChange={handleChange} className="form-input" rows="3" placeholder="Requisitos generales para todos los roles..." />
              </div>
            </div>

            <div className="roles-section">
              <div className="section-header">
                <h2 className="card-title">Roles del Casting</h2>
                <button type="button" onClick={agregarRol} className="btn-add-rol">+ Agregar Rol</button>
              </div>

              {roles.map((rol, index) => (
                <div key={index} className="perfil-card rol-card">
                  <div className="rol-header">
                    <h3 className="rol-title">Rol {index + 1}</h3>
                    {roles.length > 1 && (
                      <button type="button" onClick={() => eliminarRol(index)} className="btn-remove-rol">X Eliminar</button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nombre del Rol *</label>
                      <input type="text" value={rol.nombre_rol} onChange={(e) => handleRolChange(index, 'nombre_rol', e.target.value)} className={`form-input ${errors[`rol_${index}_nombre`] ? 'input-error' : ''}`} placeholder="Ej: Padre, Madre, Hijo" />
                      {errors[`rol_${index}_nombre`] && <span className="form-error">{errors[`rol_${index}_nombre`]}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Monto/Pago (USD)</label>
                      <input type="number" value={rol.monto} onChange={(e) => handleRolChange(index, 'monto', e.target.value)} className="form-input" placeholder="500" min="0" step="0.01" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripcion del Rol *</label>
                    <textarea value={rol.descripcion_rol} onChange={(e) => handleRolChange(index, 'descripcion_rol', e.target.value)} className={`form-input ${errors[`rol_${index}_descripcion`] ? 'input-error' : ''}`} rows="3" placeholder="Describe el personaje..." />
                    {errors[`rol_${index}_descripcion`] && <span className="form-error">{errors[`rol_${index}_descripcion`]}</span>}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Tipo de Talento</label>
                      <select value={rol.tipo_talento} onChange={(e) => handleRolChange(index, 'tipo_talento', e.target.value)} className="form-input">
                        <option value="actor">Actor/Actriz</option>
                        <option value="modelo">Modelo</option>
                        <option value="voz">Voz en Off</option>
                        <option value="extra">Extra</option>
                        <option value="bailarin">Bailarin</option>
                        <option value="musico">Musico</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Genero</label>
                      <select value={rol.sexo} onChange={(e) => handleRolChange(index, 'sexo', e.target.value)} className="form-input">
                        <option value="">Cualquiera</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Edad Min</label>
                      <input type="number" value={rol.edad_min} onChange={(e) => handleRolChange(index, 'edad_min', e.target.value)} className="form-input" min="0" max="100" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Edad Max</label>
                      <input type="number" value={rol.edad_max} onChange={(e) => handleRolChange(index, 'edad_max', e.target.value)} className="form-input" min="0" max="100" />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Altura Min (cm)</label>
                      <input type="number" value={rol.altura_min} onChange={(e) => handleRolChange(index, 'altura_min', e.target.value)} className="form-input" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Altura Max (cm)</label>
                      <input type="number" value={rol.altura_max} onChange={(e) => handleRolChange(index, 'altura_max', e.target.value)} className="form-input" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Color de Pelo</label>
                      <select value={rol.color_pelo} onChange={(e) => handleRolChange(index, 'color_pelo', e.target.value)} className="form-input">
                        <option value="">Cualquiera</option>
                        <option value="negro">Negro</option>
                        <option value="castano">Castano</option>
                        <option value="rubio">Rubio</option>
                        <option value="pelirrojo">Pelirrojo</option>
                        <option value="gris">Gris/Canoso</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Color de Ojos</label>
                      <select value={rol.color_ojos} onChange={(e) => handleRolChange(index, 'color_ojos', e.target.value)} className="form-input">
                        <option value="">Cualquiera</option>
                        <option value="marrones">Marrones</option>
                        <option value="verdes">Verdes</option>
                        <option value="azules">Azules</option>
                        <option value="grises">Grises</option>
                        <option value="negros">Negros</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Talla Camisa</label>
                      <select value={rol.talla_camisa} onChange={(e) => handleRolChange(index, 'talla_camisa', e.target.value)} className="form-input">
                        <option value="">Cualquiera</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Talla Pantalon</label>
                      <input type="text" value={rol.talla_pantalon} onChange={(e) => handleRolChange(index, 'talla_pantalon', e.target.value)} className="form-input" placeholder="Ej: 32, 34" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Talla Zapatos</label>
                      <input type="text" value={rol.talla_zapatos} onChange={(e) => handleRolChange(index, 'talla_zapatos', e.target.value)} className="form-input" placeholder="Ej: 40, 42" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn-submit-large" disabled={isSubmitting} data-testid="submit-btn">
              {isSubmitting ? 'Creando Casting...' : 'Publicar Casting'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearCasting;
