# GOCAST.me - Product Requirements Document

## Original Problem Statement
GOCAST.me es una plataforma de castings online que conecta talentos (actores, modelos, voces, etc.) con productoras y agencias en Latinoamérica.

## Core Requirements

### 1. User Authentication
- [x] Registro para talentos y productoras
- [x] Login con JWT
- [x] Checkbox obligatorio de términos legales en registro
- [x] Validación frontend y backend

### 2. Páginas Estáticas
- [x] Home - Landing page
- [x] Quiénes Somos
- [x] FAQ
- [x] Legales / Términos
- [x] Precios / Planes

### 3. Sistema de Perfiles de Talento
- [x] Perfil completo con información personal
- [x] Atributos físicos (altura, color pelo, ojos, sexo)
- [x] Tallas (camisa, pantalón, zapatos)
- [x] Descripción y talentos especiales
- [x] Disponibilidad semanal
- [x] Edición de perfil después del registro
- [ ] Subida de fotos y videos (P2 - pendiente)

### 4. Sistema de Castings Avanzado
- [x] Creación de castings con múltiples roles
- [x] Campos por rol: tipo talento, género, edad, altura, colores, tallas
- [x] Monto/pago por rol
- [x] Territorios de exhibición
- [x] Fechas límite y producción
- [x] Vista de detalles de casting con roles

### 5. Sistema de Búsqueda y Matching
- [x] Búsqueda manual de talentos con filtros
- [x] Auto-match de talentos al crear casting
- [x] Castings recomendados para talentos

### 6. Sistema de Invitaciones y Aplicaciones
- [x] Productoras pueden invitar talentos a castings
- [x] Talentos pueden aplicar a castings
- [x] Talentos pueden aceptar/rechazar invitaciones
- [x] Campo de motivo de rechazo

## Technical Stack
- **Frontend**: React, React Router, Tailwind CSS, Axios
- **Backend**: FastAPI (Python), Pydantic, Motor (MongoDB async)
- **Database**: MongoDB
- **Auth**: JWT tokens

## Architecture
```
/app
├── backend/
│   ├── server.py         # FastAPI application
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── context/      # AuthContext
    │   ├── pages/        # Page components
    │   ├── App.js        # Router configuration
    │   └── App.css       # Global styles
    └── package.json
```

## Database Schema

### users
```json
{
  "id": "uuid",
  "nombre": "string",
  "email": "string",
  "password": "hashed",
  "tipo_usuario": "talento | productora",
  "fecha_registro": "datetime",
  "activo": "boolean",
  "perfil_completo": "boolean"
}
```

### talent_profiles
```json
{
  "user_id": "uuid",
  "tipo_talento": "actor | modelo | voz | extra | bailarin | musico",
  "nombre_completo": "string",
  "edad": "int",
  "ciudad": "string",
  "pais": "string",
  "altura_cm": "int",
  "color_pelo": "string",
  "color_ojos": "string",
  "sexo": "masculino | femenino | otro",
  "talla_camisa": "XS-XXL",
  "talla_pantalon": "string",
  "talla_zapatos": "string",
  "descripcion_corta": "string",
  "talentos_especiales": "string",
  "disponibilidad": ["lunes", "martes", ...],
  "fotos": [],
  "videos": []
}
```

### castings
```json
{
  "id": "uuid",
  "productor_id": "uuid",
  "titulo": "string",
  "descripcion": "string",
  "ubicacion": "string",
  "territorios": ["Argentina", "Chile", ...],
  "duracion_exhibicion": "string",
  "fecha_limite_postulacion": "datetime",
  "fecha_produccion": "datetime",
  "requisitos_generales": "string",
  "roles": [Role],
  "estado": "activo | cerrado",
  "fecha_creacion": "datetime"
}
```

### Role (embedded in casting)
```json
{
  "nombre_rol": "string",
  "descripcion_rol": "string",
  "tipo_talento": "string",
  "sexo": "string",
  "edad_min": "int",
  "edad_max": "int",
  "altura_min": "int",
  "altura_max": "int",
  "color_pelo": "string",
  "color_ojos": "string",
  "talla_camisa": "string",
  "talla_pantalon": "string",
  "talla_zapatos": "string",
  "monto": "float"
}
```

## API Endpoints

### Authentication
- POST /api/register - Registrar usuario
- POST /api/login - Login y obtener token
- GET /api/verify-token - Verificar token

### Talent Profiles
- POST /api/perfil-talento - Crear/actualizar perfil
- GET /api/perfil-talento - Obtener perfil actual

### Castings
- POST /api/castings - Crear casting (productora)
- GET /api/castings - Listar todos los castings
- GET /api/mis-castings - Castings de la productora actual
- GET /api/castings/{id} - Detalles de un casting
- GET /api/castings-recomendados - Castings para el talento actual

### Talent Search
- GET /api/buscar-talentos - Buscar talentos con filtros
- POST /api/auto-match - Auto-match de talentos para un rol

### Applications & Invitations
- POST /api/aplicaciones - Aplicar a un casting
- GET /api/mis-aplicaciones - Aplicaciones del talento
- GET /api/aplicaciones-recibidas - Aplicaciones para la productora
- POST /api/invitaciones - Crear invitación
- GET /api/mis-invitaciones - Invitaciones del talento
- PUT /api/invitaciones/{id}/responder - Responder invitación

## Completed Work (Dec 2025)
- [x] Authentication system (register, login, JWT)
- [x] Static pages (Home, About, FAQ, Legal, Pricing)
- [x] Talent profile completion flow
- [x] Talent profile editing
- [x] Producer dashboard with casting management
- [x] Talent dashboard with invitations and recommendations
- [x] Casting creation with multiple roles
- [x] Casting detail view with roles
- [x] Talent search with filters
- [x] Invitation system (send, accept, reject)
- [x] Application system
- [x] Fixed babel-metadata-plugin recursion bug

## Remaining Work (Backlog)

### P0 (High Priority)
- None currently

### P1 (Medium Priority)
- [ ] Notificaciones en tiempo real para invitaciones
- [ ] Email notifications

### P2 (Low Priority)
- [ ] Subida de fotos y videos para perfiles de talento
- [ ] Sistema de valoraciones/reviews
- [ ] Chat entre productoras y talentos
- [ ] Integración con calendario para disponibilidad

## Known Issues
- useEffect dependency warnings in multiple components (not critical)
- Some intermittent 520 errors on high load (network related)

## Testing
- Backend tests: /app/backend/tests/test_gocast_api.py
- Test reports: /app/test_reports/

## Environment Variables

### Backend (.env)
- MONGO_URL
- DB_NAME
- SECRET_KEY

### Frontend (.env)
- REACT_APP_BACKEND_URL
