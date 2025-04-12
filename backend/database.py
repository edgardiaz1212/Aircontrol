import os
import base64
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, LargeBinary, Boolean, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Obtener la URL de conexión desde las variables de entorno
DATABASE_URL = os.environ.get('DATABASE_URL')

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL)

# Crear una sesión
Session = sessionmaker(bind=engine)
session = Session()

# Crear la base declarativa
Base = declarative_base()

# Definir el modelo para aires acondicionados
class AireAcondicionado(Base):
    __tablename__ = 'aires_acondicionados'
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    ubicacion = Column(String(200), comment="Ubicación general del equipo completo") # Ubicación general del AC
    # Considera cambiar a Date para mejor manejo y queries
    fecha_instalacion = Column(Date, nullable=True) # Cambiado a Date, permite nulos

   
    tipo = Column(String(50), nullable=True, comment="Tipo de aire (precision, confort, etc.)") 
    toneladas = Column(Float, nullable=True, comment="Capacidad en toneladas de refrigeración")

    # --- Detalles Evaporadora ---
    evaporadora_operativa = Column(Boolean, nullable=False, default=True, comment="Estado operativo de la evaporadora")
    evaporadora_marca = Column(String(100), nullable=True)
    evaporadora_modelo = Column(String(100), nullable=True)
    evaporadora_serial = Column(String(100), nullable=True, unique=True) # Seriales suelen ser únicos
    evaporadora_codigo_inventario = Column(String(100), nullable=True, unique=True) # Códigos de inventario suelen ser únicos
    evaporadora_ubicacion_instalacion = Column(String(200), nullable=True, comment="Ubicación específica de la evaporadora si difiere de la general")

    # --- Detalles Condensadora ---
    condensadora_operativa = Column(Boolean, nullable=False, default=True, comment="Estado operativo de la condensadora")
    condensadora_marca = Column(String(100), nullable=True)
    condensadora_modelo = Column(String(100), nullable=True)
    condensadora_serial = Column(String(100), nullable=True, unique=True) # Seriales suelen ser únicos
    condensadora_codigo_inventario = Column(String(100), nullable=True, unique=True) # Códigos de inventario suelen ser únicos
    condensadora_ubicacion_instalacion = Column(String(200), nullable=True, comment="Ubicación específica de la condensadora si difiere de la general")
   
    
    # Relación con las lecturas
    lecturas = relationship("Lectura", back_populates="aire", cascade="all, delete-orphan")
    
    # Relación con los mantenimientos
    mantenimientos = relationship("Mantenimiento", back_populates="aire", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AireAcondicionado(id={self.id}, nombre='{self.nombre}')>"

# Definir el modelo para lecturas
class Lectura(Base):
    __tablename__ = 'lecturas'
    
    id = Column(Integer, primary_key=True)
    aire_id = Column(Integer, ForeignKey('aires_acondicionados.id'))
    fecha = Column(DateTime, nullable=False)
    temperatura = Column(Float, nullable=False)
    humedad = Column(Float, nullable=False)
    
    # Relación con el aire acondicionado
    aire = relationship("AireAcondicionado", back_populates="lecturas")
    
    def __repr__(self):
        return f"<Lectura(id={self.id}, aire_id={self.aire_id}, fecha='{self.fecha}')>"

# Definir el modelo para mantenimientos
class Mantenimiento(Base):
    __tablename__ = 'mantenimientos'
    
    id = Column(Integer, primary_key=True)
    aire_id = Column(Integer, ForeignKey('aires_acondicionados.id'))
    fecha = Column(DateTime, nullable=False, default=datetime.now)
    tipo_mantenimiento = Column(String(100), nullable=False)
    descripcion = Column(Text)
    tecnico = Column(String(100))
    imagen_nombre = Column(String(255))
    imagen_tipo = Column(String(50))
    imagen_datos = Column(LargeBinary)  # Para almacenar la imagen como datos binarios
    
    # Relación con el aire acondicionado
    aire = relationship("AireAcondicionado", back_populates="mantenimientos")
    
    def __repr__(self):
        return f"<Mantenimiento(id={self.id}, aire_id={self.aire_id}, fecha='{self.fecha}')>"
    
    # Método para convertir la imagen a base64 para mostrar en el navegador
    def get_imagen_base64(self):
        if self.imagen_datos:
            # Codificar datos binarios a base64
            b64_data = base64.b64encode(self.imagen_datos).decode('utf-8')
            # Devolver formato que puede usar HTML para mostrar
            return f"data:{self.imagen_tipo};base64,{b64_data}"
        return None

# Definir el modelo para la configuración de umbrales
class UmbralConfiguracion(Base):
    __tablename__ = 'umbrales_configuracion'
    
    id = Column(Integer, primary_key=True)
    aire_id = Column(Integer, ForeignKey('aires_acondicionados.id'), nullable=True)
    nombre = Column(String(100), nullable=False)
    es_global = Column(Boolean, default=False)  # True si el umbral aplica a todos los aires
    
    # Umbrales de temperatura
    temp_min = Column(Float, nullable=False)
    temp_max = Column(Float, nullable=False)
    
    # Umbrales de humedad
    hum_min = Column(Float, nullable=False)
    hum_max = Column(Float, nullable=False)
    
    # Notificaciones
    notificar_activo = Column(Boolean, default=True)
    
    # Fecha de creación y última modificación
    fecha_creacion = Column(DateTime, nullable=False, default=datetime.now)
    ultima_modificacion = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    
    # Relación con el aire acondicionado (opcional)
    aire = relationship("AireAcondicionado")
    
    def __repr__(self):
        if self.es_global:
            return f"<UmbralConfiguracion(id={self.id}, nombre='{self.nombre}', global)>"
        else:
            return f"<UmbralConfiguracion(id={self.id}, nombre='{self.nombre}', aire_id={self.aire_id})>"

# Definir el modelo para usuarios
class Usuario(Base):
    __tablename__ = 'usuarios'
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)  # Almacenará hash de la contraseña
    rol = Column(String(20), nullable=False, default='operador')  # admin, supervisor, operador, etc.
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.now)
    ultima_conexion = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Usuario(id={self.id}, username='{self.username}', rol='{self.rol}')>"

from alembic.config import Config
from alembic import command

def run_migrations():
    """Run database migrations using Alembic"""
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

# Crear todas las tablas en la base de datos (now uses migrations)
def init_db():
    run_migrations()
