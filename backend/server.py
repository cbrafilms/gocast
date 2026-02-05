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

# Login Model
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

# Casting Models
class CastingCreate(BaseModel):
    titulo: str
    descripcion: str
    tipo: str = "actor"
    genero: Optional[str] = None
    edad_min: Optional[int] = None
    edad_max: Optional[int] = None
    requisitos: Optional[str] = None
    ubicacion: str
    fecha_limite: Optional[str] = None

class Casting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descripcion: str
    tipo: str
    genero: Optional[str] = None
    edad_min: Optional[int] = None
    edad_max: Optional[int] = None
    requisitos: Optional[str] = None
    ubicacion: str
    fecha_limite: Optional[str] = None
    productora_id: str
    productora_nombre: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    estado: str = "activo"

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