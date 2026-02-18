from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'gocast-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

security = HTTPBearer()


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# User Models para Registro
class UserRegister(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    tipo_usuario: str  # 'talento' o 'productora'
    acepta_terminos: bool

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    email: str
    tipo_usuario: str
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activo: bool = True
    perfil_completo: bool = False

# Login Model
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

# Casting Models con Roles Múltiples
class RolCasting(BaseModel):
    nombre_rol: str  # "Papá", "Mamá", etc.
    descripcion_rol: str
    tipo_talento: str  # actor, modelo, etc.
    sexo: Optional[str] = None
    edad_min: Optional[int] = None
    edad_max: Optional[int] = None
    altura_min: Optional[int] = None
    altura_max: Optional[int] = None
    color_pelo: Optional[str] = None
    color_ojos: Optional[str] = None
    talla_camisa: Optional[str] = None
    talla_pantalon: Optional[str] = None
    talla_zapatos: Optional[str] = None
    monto: Optional[float] = None  # Pago ofrecido

class CastingCreate(BaseModel):
    titulo: str
    descripcion: str
    roles: List[RolCasting]  # Múltiples roles
    ubicacion: str
    territorios: List[str]  # Países/continentes de exhibición
    duracion_exhibicion: Optional[str] = None  # Tiempo de exhibición
    fecha_limite_postulacion: Optional[str] = None
    fecha_produccion: Optional[str] = None
    requisitos_generales: Optional[str] = None

class Casting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descripcion: str
    roles: List[dict]  # Lista de roles
    ubicacion: str
    territorios: List[str]
    duracion_exhibicion: Optional[str] = None
    fecha_limite_postulacion: Optional[str] = None
    fecha_produccion: Optional[str] = None
    requisitos_generales: Optional[str] = None
    productora_id: str
    productora_nombre: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    estado: str = "activo"

# Perfil de Talento Models
class PerfilTalentoCreate(BaseModel):
    tipo_talento: str
    nombre_completo: str
    edad: int
    ciudad: str
    pais: str
    altura_cm: int
    color_pelo: str
    color_ojos: str
    sexo: str
    talla_camisa: str
    talla_pantalon: str
    talla_zapatos: str
    descripcion_corta: str
    talentos_especiales: Optional[str] = None
    disponibilidad: List[str]  # ['lunes', 'martes', etc]
    fotos: List[str] = []  # URLs de fotos
    videos: List[str] = []  # URLs de videos

class PerfilTalento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tipo_talento: str
    nombre_completo: str
    edad: int
    ciudad: str
    pais: str
    altura_cm: int
    color_pelo: str
    color_ojos: str
    sexo: str
    talla_camisa: str
    talla_pantalon: str
    talla_zapatos: str
    descripcion_corta: str
    talentos_especiales: Optional[str] = None
    disponibilidad: List[str]
    fotos: List[str] = []
    videos: List[str] = []
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Aplicación a Casting Models
class AplicacionCreate(BaseModel):
    casting_id: str
    mensaje: Optional[str] = None

class Aplicacion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    casting_id: str
    talento_id: str
    talento_nombre: str
    estado: str = "pendiente"  # pendiente, aceptada, rechazada
    mensaje: Optional[str] = None
    respuesta: Optional[str] = None
    fecha_aplicacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Invitación Models
class InvitacionCreate(BaseModel):
    casting_id: str
    rol_nombre: str  # A qué rol específico se invita
    talento_id: str
    mensaje: Optional[str] = None

class Invitacion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    casting_id: str
    casting_titulo: str
    rol_nombre: str
    talento_id: str
    talento_nombre: str
    productora_id: str
    productora_nombre: str
    estado: str = "pendiente"  # pendiente, aceptada, rechazada
    mensaje: Optional[str] = None
    respuesta_talento: Optional[str] = None
    fecha_invitacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="No se pudo validar el token")
    
    # Buscar usuario en la base de datos
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    # Convertir fecha_registro si es string
    if isinstance(user_doc['fecha_registro'], str):
        user_doc['fecha_registro'] = datetime.fromisoformat(user_doc['fecha_registro'])
    
    return User(**user_doc)

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Endpoint de Registro
@api_router.post("/register", response_model=User)
async def register_user(user_data: UserRegister):
    # Validar que acepta términos
    if not user_data.acepta_terminos:
        raise HTTPException(
            status_code=400, 
            detail="Debes aceptar los términos y condiciones para registrarte"
        )
    
    # Validar tipo de usuario
    if user_data.tipo_usuario not in ['talento', 'productora']:
        raise HTTPException(
            status_code=400,
            detail="Tipo de usuario inválido. Debe ser 'talento' o 'productora'"
        )
    
    # Verificar si el email ya existe
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Este email ya está registrado"
        )
    
    # Hash de la contraseña (simple hash para el ejemplo)
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    
    # Crear objeto User
    user = User(
        nombre=user_data.nombre,
        email=user_data.email,
        tipo_usuario=user_data.tipo_usuario
    )
    
    # Preparar documento para MongoDB
    doc = user.model_dump()
    doc['password_hash'] = password_hash
    doc['fecha_registro'] = doc['fecha_registro'].isoformat()
    
    # Insertar en la base de datos
    try:
        await db.users.insert_one(doc)
        logger.info(f"Usuario registrado: {user.email} ({user.tipo_usuario})")
        return user
    except Exception as e:
        logger.error(f"Error al registrar usuario: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear el usuario"
        )

# Endpoint de Login
@api_router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin):
    # Buscar usuario por email
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar contraseña
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    
    if user_doc.get('password_hash') != password_hash:
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )
    
    # Convertir fecha_registro si es string
    if isinstance(user_doc['fecha_registro'], str):
        user_doc['fecha_registro'] = datetime.fromisoformat(user_doc['fecha_registro'])
    
    # Crear usuario sin password_hash
    user_doc_clean = {k: v for k, v in user_doc.items() if k != 'password_hash'}
    user = User(**user_doc_clean)
    
    # Crear token JWT
    access_token = create_access_token(data={"sub": user.id})
    
    logger.info(f"Usuario logueado: {user.email}")
    
    return LoginResponse(token=access_token, user=user)

# Endpoint para verificar token
@api_router.get("/verify-token", response_model=User)
async def verify_token(current_user: User = Depends(get_current_user)):
    return current_user

# Endpoint para crear casting (solo productoras)
@api_router.post("/castings", response_model=Casting)
async def create_casting(
    casting_data: CastingCreate,
    current_user: User = Depends(get_current_user)
):
    # Verificar que sea productora
    if current_user.tipo_usuario != 'productora':
        raise HTTPException(
            status_code=403,
            detail="Solo las productoras pueden crear castings"
        )
    
    # Crear objeto Casting
    casting = Casting(
        **casting_data.model_dump(),
        productora_id=current_user.id,
        productora_nombre=current_user.nombre
    )
    
    # Preparar documento para MongoDB
    doc = casting.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    
    # Insertar en la base de datos
    try:
        await db.castings.insert_one(doc)
        logger.info(f"Casting creado: {casting.titulo} por {current_user.nombre}")
        return casting
    except Exception as e:
        logger.error(f"Error al crear casting: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear el casting"
        )

# Endpoint para obtener todos los castings activos
@api_router.get("/castings", response_model=List[Casting])
async def get_castings(current_user: User = Depends(get_current_user)):
    # Obtener castings activos
    castings = await db.castings.find(
        {"estado": "activo"}, 
        {"_id": 0}
    ).to_list(100)
    
    # Convertir fechas
    for casting in castings:
        if isinstance(casting['fecha_creacion'], str):
            casting['fecha_creacion'] = datetime.fromisoformat(casting['fecha_creacion'])
    
    return castings

# Endpoint para obtener castings de la productora actual
@api_router.get("/mis-castings", response_model=List[Casting])
async def get_mis_castings(current_user: User = Depends(get_current_user)):
    # Verificar que sea productora
    if current_user.tipo_usuario != 'productora':
        raise HTTPException(
            status_code=403,
            detail="Solo las productoras pueden ver sus castings"
        )
    
    # Obtener castings de la productora
    castings = await db.castings.find(
        {"productora_id": current_user.id},
        {"_id": 0}
    ).sort("fecha_creacion", -1).to_list(100)
    
    # Convertir fechas
    for casting in castings:
        if isinstance(casting['fecha_creacion'], str):
            casting['fecha_creacion'] = datetime.fromisoformat(casting['fecha_creacion'])
    
    return castings

# Endpoint para crear/actualizar perfil de talento
@api_router.post("/perfil-talento", response_model=PerfilTalento)
async def crear_perfil_talento(
    perfil_data: PerfilTalentoCreate,
    current_user: User = Depends(get_current_user)
):
    # Verificar que sea talento
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden crear perfil"
        )
    
    # Crear objeto Perfil
    perfil = PerfilTalento(
        **perfil_data.model_dump(),
        user_id=current_user.id
    )
    
    # Preparar documento para MongoDB
    doc = perfil.model_dump()
    doc['fecha_creacion'] = doc['fecha_creacion'].isoformat()
    
    try:
        # Verificar si ya existe perfil
        existing = await db.perfiles_talento.find_one({"user_id": current_user.id}, {"_id": 0})
        
        if existing:
            # Actualizar perfil existente
            await db.perfiles_talento.update_one(
                {"user_id": current_user.id},
                {"$set": doc}
            )
        else:
            # Insertar nuevo perfil
            await db.perfiles_talento.insert_one(doc)
        
        # Marcar usuario como perfil completo
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": {"perfil_completo": True}}
        )
        
        logger.info(f"Perfil creado/actualizado para: {current_user.email}")
        return perfil
    except Exception as e:
        logger.error(f"Error al crear perfil: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear el perfil"
        )

# Endpoint para obtener perfil de talento
@api_router.get("/perfil-talento", response_model=PerfilTalento)
async def get_perfil_talento(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden ver este perfil"
        )
    
    perfil_doc = await db.perfiles_talento.find_one(
        {"user_id": current_user.id},
        {"_id": 0}
    )
    
    if not perfil_doc:
        raise HTTPException(
            status_code=404,
            detail="Perfil no encontrado. Debe completar su perfil."
        )
    
    # Convertir fecha
    if isinstance(perfil_doc['fecha_creacion'], str):
        perfil_doc['fecha_creacion'] = datetime.fromisoformat(perfil_doc['fecha_creacion'])
    
    return PerfilTalento(**perfil_doc)

# Endpoint para aplicar a un casting
@api_router.post("/aplicaciones", response_model=Aplicacion)
async def aplicar_casting(
    aplicacion_data: AplicacionCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden aplicar a castings"
        )
    
    # Verificar que existe el casting
    casting = await db.castings.find_one(
        {"id": aplicacion_data.casting_id},
        {"_id": 0}
    )
    
    if not casting:
        raise HTTPException(
            status_code=404,
            detail="Casting no encontrado"
        )
    
    # Verificar que no haya aplicado ya
    existing = await db.aplicaciones.find_one({
        "casting_id": aplicacion_data.casting_id,
        "talento_id": current_user.id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya has aplicado a este casting"
        )
    
    # Crear aplicación
    aplicacion = Aplicacion(
        casting_id=aplicacion_data.casting_id,
        talento_id=current_user.id,
        talento_nombre=current_user.nombre,
        mensaje=aplicacion_data.mensaje
    )
    
    doc = aplicacion.model_dump()
    doc['fecha_aplicacion'] = doc['fecha_aplicacion'].isoformat()
    
    try:
        await db.aplicaciones.insert_one(doc)
        logger.info(f"Aplicación creada: {current_user.nombre} -> {casting['titulo']}")
        return aplicacion
    except Exception as e:
        logger.error(f"Error al crear aplicación: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al aplicar al casting"
        )

# Endpoint para obtener mis aplicaciones (talento)
@api_router.get("/mis-aplicaciones", response_model=List[Aplicacion])
async def get_mis_aplicaciones(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden ver sus aplicaciones"
        )
    
    aplicaciones = await db.aplicaciones.find(
        {"talento_id": current_user.id},
        {"_id": 0}
    ).sort("fecha_aplicacion", -1).to_list(100)
    
    for app in aplicaciones:
        if isinstance(app['fecha_aplicacion'], str):
            app['fecha_aplicacion'] = datetime.fromisoformat(app['fecha_aplicacion'])
    
    return aplicaciones

# Endpoint para obtener aplicaciones recibidas (productora)
@api_router.get("/aplicaciones-recibidas")
async def get_aplicaciones_recibidas(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != 'productora':
        raise HTTPException(
            status_code=403,
            detail="Solo las productoras pueden ver aplicaciones recibidas"
        )
    
    # Obtener los IDs de los castings de esta productora
    mis_castings = await db.castings.find(
        {"productor_id": current_user.id},
        {"id": 1, "_id": 0}
    ).to_list(100)
    
    casting_ids = [c['id'] for c in mis_castings]
    
    if not casting_ids:
        return []
    
    # Obtener todas las aplicaciones a esos castings
    aplicaciones = await db.aplicaciones.find(
        {"casting_id": {"$in": casting_ids}},
        {"_id": 0}
    ).sort("fecha_aplicacion", -1).to_list(100)
    
    # Enriquecer con datos del talento
    for app in aplicaciones:
        if isinstance(app.get('fecha_aplicacion'), str):
            app['fecha_aplicacion'] = datetime.fromisoformat(app['fecha_aplicacion'])
        
        # Obtener nombre del talento
        perfil = await db.talent_profiles.find_one(
            {"user_id": app.get('talento_id')},
            {"nombre_completo": 1, "_id": 0}
        )
        app['talento_nombre'] = perfil.get('nombre_completo') if perfil else 'Talento'
    
    return aplicaciones

# Endpoint para obtener detalle de un casting específico
@api_router.get("/castings/{casting_id}", response_model=Casting)
async def get_casting_detalle(
    casting_id: str,
    current_user: User = Depends(get_current_user)
):
    casting = await db.castings.find_one(
        {"id": casting_id},
        {"_id": 0}
    )
    
    if not casting:
        raise HTTPException(
            status_code=404,
            detail="Casting no encontrado"
        )
    
    if isinstance(casting['fecha_creacion'], str):
        casting['fecha_creacion'] = datetime.fromisoformat(casting['fecha_creacion'])
    
    return Casting(**casting)

# Endpoint para obtener castings filtrados según perfil del talento
@api_router.get("/castings-recomendados", response_model=List[Casting])
async def get_castings_recomendados(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden ver castings recomendados"
        )
    
    # Obtener perfil del talento
    perfil = await db.perfiles_talento.find_one(
        {"user_id": current_user.id},
        {"_id": 0}
    )
    
    if not perfil:
        # Si no tiene perfil, retornar lista vacía
        return []
    
    # Obtener todos los castings activos
    castings = await db.castings.find({"estado": "activo"}, {"_id": 0}).to_list(100)
    
    # Filtrar castings que tengan al menos un rol compatible
    castings_filtrados = []
    for casting in castings:
        tiene_rol_compatible = False
        
        # Revisar cada rol del casting
        for rol in casting.get('roles', []):
            compatible = True
            
            # Filtro de tipo de talento
            if rol.get('tipo_talento') and perfil.get('tipo_talento'):
                if rol['tipo_talento'].lower() != perfil['tipo_talento'].lower():
                    compatible = False
            
            # Filtro de género
            if rol.get('sexo') and perfil.get('sexo'):
                if rol['sexo'].lower() != 'cualquiera' and rol['sexo'].lower() != perfil['sexo'].lower():
                    compatible = False
            
            # Filtro de edad
            if rol.get('edad_min') and perfil.get('edad'):
                if perfil['edad'] < rol['edad_min']:
                    compatible = False
            
            if rol.get('edad_max') and perfil.get('edad'):
                if perfil['edad'] > rol['edad_max']:
                    compatible = False
            
            # Filtro de altura
            if rol.get('altura_min') and perfil.get('altura_cm'):
                if perfil['altura_cm'] < rol['altura_min']:
                    compatible = False
            
            if rol.get('altura_max') and perfil.get('altura_cm'):
                if perfil['altura_cm'] > rol['altura_max']:
                    compatible = False
            
            if compatible:
                tiene_rol_compatible = True
                break
        
        if tiene_rol_compatible:
            if isinstance(casting['fecha_creacion'], str):
                casting['fecha_creacion'] = datetime.fromisoformat(casting['fecha_creacion'])
            castings_filtrados.append(Casting(**casting))
    
    return castings_filtrados

# Endpoint para buscar talentos con filtros
@api_router.get("/buscar-talentos")
async def buscar_talentos(
    current_user: User = Depends(get_current_user),
    tipo_talento: Optional[str] = None,
    sexo: Optional[str] = None,
    edad_min: Optional[int] = None,
    edad_max: Optional[int] = None,
    altura_min: Optional[int] = None,
    altura_max: Optional[int] = None,
    color_pelo: Optional[str] = None,
    color_ojos: Optional[str] = None,
    talla_camisa: Optional[str] = None,
    talla_pantalon: Optional[str] = None,
    talla_zapatos: Optional[str] = None,
    ciudad: Optional[str] = None,
    pais: Optional[str] = None
):
    if current_user.tipo_usuario != 'productora':
        raise HTTPException(
            status_code=403,
            detail="Solo las productoras pueden buscar talentos"
        )
    
    # Construir filtro dinamico
    filtro = {}
    
    if tipo_talento:
        filtro['tipo_talento'] = tipo_talento
    if sexo:
        filtro['sexo'] = sexo
    if color_pelo:
        filtro['color_pelo'] = color_pelo
    if color_ojos:
        filtro['color_ojos'] = color_ojos
    if talla_camisa:
        filtro['talla_camisa'] = talla_camisa
    if talla_pantalon:
        filtro['talla_pantalon'] = talla_pantalon
    if talla_zapatos:
        filtro['talla_zapatos'] = talla_zapatos
    if ciudad:
        filtro['ciudad'] = {"$regex": ciudad, "$options": "i"}
    if pais:
        filtro['pais'] = {"$regex": pais, "$options": "i"}
    
    # Obtener perfiles
    perfiles = await db.perfiles_talento.find(filtro, {"_id": 0}).to_list(100)
    
    # Filtrar por edad y altura si se especifica
    resultados = []
    for perfil in perfiles:
        incluir = True
        
        if edad_min and perfil.get('edad', 0) < edad_min:
            incluir = False
        if edad_max and perfil.get('edad', 999) > edad_max:
            incluir = False
        if altura_min and perfil.get('altura_cm', 0) < altura_min:
            incluir = False
        if altura_max and perfil.get('altura_cm', 999) > altura_max:
            incluir = False
        
        if incluir:
            # Obtener info del usuario
            user = await db.users.find_one({"id": perfil['user_id']}, {"_id": 0})
            if user:
                perfil['email'] = user['email']
                resultados.append(perfil)
    
    return resultados

# Endpoint para auto-match (encontrar talentos que coincidan con un rol)
@api_router.post("/auto-match")
async def auto_match(
    rol: RolCasting,
    current_user: User = Depends(get_current_user)
):
    if current_user.tipo_usuario != 'productora':
        raise HTTPException(
            status_code=403,
            detail="Solo las productoras pueden usar auto-match"
        )
    
    # Construir filtro basado en el rol
    filtro = {}
    
    if rol.tipo_talento:
        filtro['tipo_talento'] = rol.tipo_talento
    if rol.sexo:
        filtro['sexo'] = rol.sexo
    if rol.color_pelo:
        filtro['color_pelo'] = rol.color_pelo
    if rol.color_ojos:
        filtro['color_ojos'] = rol.color_ojos
    if rol.talla_camisa:
        filtro['talla_camisa'] = rol.talla_camisa
    if rol.talla_pantalon:
        filtro['talla_pantalon'] = rol.talla_pantalon
    if rol.talla_zapatos:
        filtro['talla_zapatos'] = rol.talla_zapatos
    
    # Buscar perfiles que coincidan
    perfiles = await db.perfiles_talento.find(filtro, {"_id": 0}).to_list(100)
    
    # Filtrar por rangos
    talentos = []
    for perfil in perfiles:
        incluir = True
        
        # Filtro de edad
        if rol.edad_min and perfil.get('edad', 0) < rol.edad_min:
            incluir = False
        if rol.edad_max and perfil.get('edad', 999) > rol.edad_max:
            incluir = False
        
        # Filtro de altura
        if rol.altura_min and perfil.get('altura_cm', 0) < rol.altura_min:
            incluir = False
        if rol.altura_max and perfil.get('altura_cm', 999) > rol.altura_max:
            incluir = False
        
        if incluir:
            # Agregar info del usuario
            user = await db.users.find_one({"id": perfil['user_id']}, {"_id": 0})
            if user:
                perfil['email'] = user['email']
                perfil['user_nombre'] = user['nombre']
                talentos.append(perfil)
    
    return {
        "total_matches": len(talentos),
        "talentos": talentos
    }

# Endpoint para crear invitación
@api_router.post("/invitaciones", response_model=Invitacion)
async def crear_invitacion(
    invitacion_data: InvitacionCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.tipo_usuario != 'productora':
        raise HTTPException(
            status_code=403,
            detail="Solo las productoras pueden enviar invitaciones"
        )
    
    # Verificar que existe el casting
    casting = await db.castings.find_one({"id": invitacion_data.casting_id}, {"_id": 0})
    if not casting:
        raise HTTPException(status_code=404, detail="Casting no encontrado")
    
    # Verificar que no haya invitado ya
    existing = await db.invitaciones.find_one({
        "casting_id": invitacion_data.casting_id,
        "rol_nombre": invitacion_data.rol_nombre,
        "talento_id": invitacion_data.talento_id
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya has invitado a este talento para este rol"
        )
    
    # Obtener info del talento
    talento_user = await db.users.find_one({"id": invitacion_data.talento_id}, {"_id": 0})
    if not talento_user:
        raise HTTPException(status_code=404, detail="Talento no encontrado")
    
    # Crear invitación
    invitacion = Invitacion(
        casting_id=invitacion_data.casting_id,
        casting_titulo=casting['titulo'],
        rol_nombre=invitacion_data.rol_nombre,
        talento_id=invitacion_data.talento_id,
        talento_nombre=talento_user['nombre'],
        productora_id=current_user.id,
        productora_nombre=current_user.nombre,
        mensaje=invitacion_data.mensaje
    )
    
    doc = invitacion.model_dump()
    doc['fecha_invitacion'] = doc['fecha_invitacion'].isoformat()
    
    try:
        await db.invitaciones.insert_one(doc)
        logger.info(f"Invitación creada: {casting['titulo']} -> {talento_user['nombre']}")
        return invitacion
    except Exception as e:
        logger.error(f"Error al crear invitación: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al crear invitación")

# Endpoint para obtener mis invitaciones (talento)
@api_router.get("/mis-invitaciones", response_model=List[Invitacion])
async def get_mis_invitaciones(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden ver sus invitaciones"
        )
    
    invitaciones = await db.invitaciones.find(
        {"talento_id": current_user.id},
        {"_id": 0}
    ).sort("fecha_invitacion", -1).to_list(100)
    
    for inv in invitaciones:
        if isinstance(inv['fecha_invitacion'], str):
            inv['fecha_invitacion'] = datetime.fromisoformat(inv['fecha_invitacion'])
    
    return invitaciones

# Endpoint para responder a una invitación
@api_router.put("/invitaciones/{invitacion_id}/responder")
async def responder_invitacion(
    invitacion_id: str,
    respuesta: str,  # "aceptada" o "rechazada"
    mensaje_respuesta: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    if current_user.tipo_usuario != 'talento':
        raise HTTPException(
            status_code=403,
            detail="Solo los talentos pueden responder invitaciones"
        )
    
    if respuesta not in ["aceptada", "rechazada"]:
        raise HTTPException(
            status_code=400,
            detail="Respuesta debe ser 'aceptada' o 'rechazada'"
        )
    
    # Actualizar invitación
    result = await db.invitaciones.update_one(
        {"id": invitacion_id, "talento_id": current_user.id},
        {"$set": {
            "estado": respuesta,
            "respuesta_talento": mensaje_respuesta
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Invitación no encontrada"
        )
    
    return {"message": f"Invitación {respuesta} exitosamente"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()