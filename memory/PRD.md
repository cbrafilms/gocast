# GOCAST.me - Product Requirements Document

## Original Problem Statement
GOCAST.me es una plataforma de castings online que conecta talentos (actores, modelos, voces, etc.) con productoras y agencias en Latinoamerica.

## Core Requirements

### 1. User Authentication
- [x] Registro para talentos y productoras
- [x] Login con JWT
- [x] Checkbox obligatorio de terminos legales en registro
- [x] Validacion frontend y backend

### 2. Paginas Estaticas
- [x] Home - Landing page
- [x] Quienes Somos
- [x] FAQ
- [x] Legales / Terminos
- [x] Precios / Planes

### 3. Sistema de Perfiles de Talento
- [x] Perfil completo con informacion personal
- [x] Atributos fisicos (altura, color pelo, ojos, sexo)
- [x] Tallas (camisa, pantalon, zapatos)
- [x] Descripcion y talentos especiales
- [x] Disponibilidad semanal
- [x] Edicion de perfil despues del registro
- [ ] Subida de fotos y videos (P2 - pendiente)

### 4. Sistema de Castings Avanzado
- [x] Creacion de castings con multiples roles
- [x] Campos por rol: tipo talento, genero, edad, altura, colores, tallas
- [x] Monto/pago por rol
- [x] Territorios de exhibicion
- [x] Fechas limite y produccion
- [x] Vista de detalles de casting con roles
- [x] Auto-match de talentos al crear casting (muestra talentos coincidentes)

### 5. Sistema de Busqueda y Matching
- [x] Busqueda manual de talentos con filtros avanzados
- [x] Filtros de tallas (camisa, pantalon, zapatos)
- [x] Auto-match de talentos al crear casting
- [x] Castings recomendados para talentos

### 6. Sistema de Invitaciones y Aplicaciones
- [x] Productoras pueden invitar talentos a castings
- [x] Modal de invitacion con seleccion de casting y rol
- [x] Talentos pueden aplicar a castings
- [x] Talentos pueden aceptar/rechazar invitaciones
- [x] Campo de motivo de rechazo

### 7. Sistema de Shortlist/Preseleccion (NUEVO - Dic 2025)
- [x] Productoras pueden preseleccionar talentos de las aplicaciones
- [x] Marcar talentos como "Titular" o "Backup"
- [x] Crear shortlists con talentos seleccionados
- [x] Generar URL publica para compartir con clientes
- [x] Vista publica de shortlist para clientes

## Technical Stack
- **Frontend**: React, React Router, Axios
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
    │   ├── components/   # DashboardTalento, DashboardProductora
    │   ├── context/      # AuthContext
    │   ├── pages/        # All page components
    │   ├── App.js        # Router configuration
    │   └── App.css       # Global styles
    └── package.json
```

## Pages & Routes
- `/` - Home
- `/quienes-somos` - About Us
- `/faq` - FAQ
- `/legales` - Legal Terms
- `/precios` - Pricing
- `/registro` - Registration
- `/login` - Login
- `/dashboard` - User Dashboard
- `/crear-casting` - Create Casting (Producer)
- `/completar-perfil` - Complete Profile (Talent)
- `/editar-perfil` - Edit Profile (Talent)
- `/casting/:id` - Casting Details
- `/buscar-talentos` - Search Talents (Producer)
- `/gestionar-casting/:id` - Manage Casting (Producer) - NEW
- `/ver-shortlist/:urlPublica` - Public Shortlist View - NEW

## API Endpoints

### Authentication
- POST /api/register
- POST /api/login
- GET /api/verify-token

### Talent Profiles
- POST /api/perfil-talento
- GET /api/perfil-talento

### Castings
- POST /api/castings
- GET /api/castings
- GET /api/mis-castings
- GET /api/castings/{id}
- GET /api/castings-recomendados

### Talent Search
- GET /api/buscar-talentos (con filtros de tallas)
- POST /api/auto-match

### Applications & Invitations
- POST /api/aplicaciones
- GET /api/mis-aplicaciones
- GET /api/aplicaciones-recibidas
- POST /api/invitaciones
- GET /api/mis-invitaciones
- PUT /api/invitaciones/{id}/responder

### Shortlist (NUEVO)
- POST /api/shortlists
- GET /api/castings/{id}/shortlists
- GET /api/shortlist/{url_publica}
- POST /api/aplicaciones/{id}/preseleccionar
- GET /api/castings/{id}/preseleccionados

## Completed Work (Dec 2025)
- [x] Authentication system (register, login, JWT)
- [x] Static pages (Home, About, FAQ, Legal, Pricing)
- [x] Talent profile flow with all fields
- [x] Producer dashboard with casting management
- [x] Talent dashboard with invitations
- [x] Casting creation with multiple roles and sizes
- [x] Talent search with advanced filters (sizes)
- [x] Invitation system (send, accept, reject)
- [x] Application system
- [x] Auto-match showing matching talents
- [x] Shortlist/preselection system
- [x] Public shareable shortlist URLs
- [x] Fixed babel-metadata-plugin recursion bug

## Remaining Work (Backlog)

### P1 (Medium Priority)
- [ ] Notificaciones en tiempo real
- [ ] Email notifications

### P2 (Low Priority)
- [ ] Subida de fotos y videos para perfiles
- [ ] Sistema de valoraciones/reviews
- [ ] Chat entre productoras y talentos

## Known Issues
- Babel plugin visual-edits disabled to avoid recursion bug
- useEffect dependency warnings (not critical)

## Environment Variables

### Backend (.env)
- MONGO_URL
- DB_NAME
- SECRET_KEY

### Frontend (.env)
- REACT_APP_BACKEND_URL
