import os
import sys
from dotenv import load_dotenv
import traceback
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env') # Sube un nivel para encontrar .env en la raíz
load_dotenv(dotenv_path=dotenv_path)
db_url_check = os.getenv('DATABASE_URL')
if not db_url_check:
    print("ERROR URGENTE: DATABASE_URL no se cargó desde .env en app.py!", file=sys.stderr)
    print(f"Intentando cargar desde: {dotenv_path}", file=sys.stderr)
    # Podrías decidir salir si la URL es esencial para continuar
    # sys.exit(1)
else:
    print(f"app.py: DATABASE_URL cargada correctamente desde {dotenv_path}")


from database import init_db, session, Usuario, Lectura, AireAcondicionado, Mantenimiento, OtroEquipo
from data_manager import DataManager
from flask import Flask, jsonify, request, session, Blueprint
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, 
    create_access_token, 
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta, datetime
import pandas as pd


# # Añadir el directorio principal al path para importar los módulos de database y data_manager
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# from backend.data_manager import DataManager
# from backend.database import init_db, Usuario

# Inicializar la aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clave_secreta_para_desarrollo')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt_clave_secreta_para_desarrollo')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Habilitar CORS para permitir solicitudes desde el frontend con credenciales
CORS(app, 
     resources={r"/*": {"origins": "http://localhost:3000"}},  # Update with your frontend URL
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Authorization"])

# Inicializar JWT
jwt = JWTManager(app)

# Crear un Blueprint
aircontrol_bp = Blueprint('aircontrol', __name__)

# Configurar manejadores de errores para JWT
@jwt.invalid_token_loader
def invalid_token_callback(error):
    # print("\n=== JWT Validation Failed ===")
    # print(f"Error: {error}")
    # print(f"Authorization Header: {request.headers.get('Authorization')}")
    # print(f"Current JWT_SECRET_KEY: {app.config['JWT_SECRET_KEY']}")
    return jsonify({
        'success': False,
        'mensaje': 'Token inválido',
        'error': str(error)
    }), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'mensaje': 'Token expirado',
        'error': 'Token has expired'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'success': False,
        'mensaje': 'Token no proporcionado',
        'error': str(error)
    }), 401

# Inicializar la base de datos
init_db()

# Inicializar el gestor de datos
data_manager = DataManager()
# Crear usuario administrador por defecto si no existe ninguno
data_manager.crear_admin_por_defecto()

# Ruta de inicio
@aircontrol_bp.route('/')
def index():
    return jsonify({"mensaje": "API de Monitoreo AC funcionando"})

# Rutas de autenticación
@aircontrol_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    usuario = data_manager.verificar_credenciales(username, password)
    
    if usuario:
        # Crear token de acceso
        # Store user identity in additional claims
        access_token = create_access_token(
            identity=str(usuario.id),  # Simple string subject
            additional_claims={
                'username': usuario.username,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'rol': usuario.rol
            }
        )
        
        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': {
                'id': usuario.id,
                'username': usuario.username,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'rol': usuario.rol
            }
        })
    
    return jsonify({'success': False, 'mensaje': 'Credenciales inválidas'})

@aircontrol_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    nombre = data.get('nombre', '')
    apellido = data.get('apellido', '')
    email = data.get('email', '')
    username = data.get('username', '')
    password = data.get('password', '')
    
    # Verificar datos requeridos
    if not (nombre and apellido and email and username and password):
        return jsonify({'success': False, 'mensaje': 'Todos los campos son requeridos'})
    
    # Asignar rol
    rol = data.get('rol', 'operador')
    # Solo un administrador puede crear otros roles
    current_user_id = None
    if request.headers.get('Authorization'):
        jwt_data = get_jwt()
        current_user_id = jwt_data.get('sub') or jwt_data.get('id')
    if current_user_id:
        current_user = data_manager.obtener_usuario_por_id(current_user_id)
        if current_user and current_user.rol == 'admin':
            if rol not in ['admin', 'supervisor', 'operador']:
                rol = 'operador'
        else:
            rol = 'operador'
    else:
        rol = 'operador'
    
    # Crear usuario
    usuario_id = data_manager.crear_usuario(
        nombre=nombre,
        apellido=apellido,
        email=email,
        username=username,
        password=password,
        rol=rol
    )
    
    if usuario_id:
        return jsonify({'success': True, 'mensaje': 'Usuario registrado exitosamente', 'id': usuario_id})
    else:
        return jsonify({'success': False, 'mensaje': 'El email o nombre de usuario ya están en uso'})

@aircontrol_bp.route('/api/admin/users', methods=['POST']) # Nueva ruta específica para admin crear usuarios
@jwt_required()
def admin_create_user():
    # 1. Verificar que el usuario actual es administrador
    jwt_data = get_jwt()
    if jwt_data.get('rol') != 'admin':
        return jsonify({'success': False, 'mensaje': 'Acceso denegado: Se requiere rol de administrador'}), 403

    # 2. Obtener datos del nuevo usuario desde el request
    data = request.get_json()
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    email = data.get('email')
    username = data.get('username')
    password = data.get('password') 
    rol = data.get('rol') # El admin puede especificar el rol

    # 3. Validar datos requeridos
    if not (nombre and apellido and email and username and password and rol):
        return jsonify({'success': False, 'mensaje': 'Todos los campos son requeridos (nombre, apellido, email, username, password, rol)'}), 400

    # 3.1 Validar rol (opcional, pero buena práctica)
    if rol not in ['admin', 'supervisor', 'operador']:
         return jsonify({'success': False, 'mensaje': f"Rol '{rol}' inválido. Roles permitidos: admin, supervisor, operador"}), 400

    # 4. Intentar crear el usuario usando el DataManager
    usuario_id = data_manager.crear_usuario(
        nombre=nombre,
        apellido=apellido,
        email=email,
        username=username,
        password=password, 
        rol=rol
    )

    # 5. Devolver respuesta
    if usuario_id:
        # Podrías devolver el ID o incluso los datos del usuario creado (sin la contraseña)
        return jsonify({'success': True, 'mensaje': 'Usuario creado exitosamente por el administrador', 'id': usuario_id}), 201 # 201 Created
    else:
        # El DataManager devuelve None si el email/username ya existen
        return jsonify({'success': False, 'mensaje': 'Error al crear el usuario. El email o nombre de usuario ya podrían estar en uso.'}), 409

@aircontrol_bp.route('/api/auth/user', methods=['GET'])
@jwt_required()
def get_user():
    jwt_data = get_jwt()
    current_user = {
        'id': int(get_jwt_identity()),
        'username': jwt_data.get('username'),
        'nombre': jwt_data.get('nombre'),
        'apellido': jwt_data.get('apellido'),
        'email': jwt_data.get('email'),
        'rol': jwt_data.get('rol')
    }
    return jsonify(current_user)

# Rutas para aires acondicionados
@aircontrol_bp.route('/api/aires', methods=['GET'])
@jwt_required()
def get_aires():
    aires_df = data_manager.obtener_aires()
    
    if aires_df.empty:
        return jsonify([])
    
    aires = []
    for _, row in aires_df.iterrows():
        aires.append({
            'id': int(row['id']),
            'nombre': row['nombre'],
            'ubicacion': row['ubicacion'],
            'fecha_instalacion': row['fecha_instalacion'],
            'tipo': row['tipo'],
            'toneladas': float(row['toneladas']) if row['toneladas'] else None,
            'evaporadora_operativa': bool(row['evaporadora_operativa']),
            'evaporadora_marca': row['evaporadora_marca'],
            'evaporadora_modelo': row['evaporadora_modelo'],
            'evaporadora_serial': row['evaporadora_serial'],
            'evaporadora_codigo_inventario': row['evaporadora_codigo_inventario'],
            'evaporadora_ubicacion_instalacion': row['evaporadora_ubicacion_instalacion'],
            'condensadora_operativa': bool(row['condensadora_operativa']),
            'condensadora_marca': row['condensadora_marca'],
            'condensadora_modelo': row['condensadora_modelo'],
            'condensadora_serial': row['condensadora_serial'],
            'condensadora_codigo_inventario': row['condensadora_codigo_inventario'],
            'condensadora_ubicacion_instalacion': row['condensadora_ubicacion_instalacion'],


        })
    
    return jsonify(aires)

@aircontrol_bp.route('/api/aires/<int:aire_id>', methods=['GET'])
@jwt_required()
def get_aire_by_id(aire_id):
    """
    Obtiene los detalles de un aire acondicionado específico por su ID.
    """
    try:
        # Llama al método del DataManager para obtener el aire
        aire_obj = data_manager.obtener_aire_por_id(aire_id)

        if aire_obj:
            # Convertir el objeto SQLAlchemy a un diccionario JSON serializable
            # Asegúrate de incluir todos los campos que necesita el frontend
            aire_dict = {
                'id': aire_obj.id,
                'nombre': aire_obj.nombre,
                'ubicacion': aire_obj.ubicacion,
                'fecha_instalacion': aire_obj.fecha_instalacion, # Asume que es string YYYY-MM-DD
                'tipo': aire_obj.tipo,
                'toneladas': float(aire_obj.toneladas) if aire_obj.toneladas is not None else None,
                # Evaporadora
                'evaporadora_operativa': bool(aire_obj.evaporadora_operativa),
                'evaporadora_marca': aire_obj.evaporadora_marca,
                'evaporadora_modelo': aire_obj.evaporadora_modelo,
                'evaporadora_serial': aire_obj.evaporadora_serial,
                'evaporadora_codigo_inventario': aire_obj.evaporadora_codigo_inventario,
                'evaporadora_ubicacion_instalacion': aire_obj.evaporadora_ubicacion_instalacion,
                # Condensadora
                'condensadora_operativa': bool(aire_obj.condensadora_operativa),
                'condensadora_marca': aire_obj.condensadora_marca,
                'condensadora_modelo': aire_obj.condensadora_modelo,
                'condensadora_serial': aire_obj.condensadora_serial,
                'condensadora_codigo_inventario': aire_obj.condensadora_codigo_inventario,
                'condensadora_ubicacion_instalacion': aire_obj.condensadora_ubicacion_instalacion,
                # Añade otros campos si los tienes en el modelo AireAcondicionado
            }
            return jsonify(aire_dict) # Devuelve el diccionario como JSON
        else:
            # Si no se encuentra el aire, devuelve 404 Not Found
            return jsonify({'success': False, 'mensaje': 'Aire acondicionado no encontrado'}), 404

    except Exception as e:
        print(f"Error en get_aire_by_id para ID {aire_id}: {e}", file=sys.stderr)
        traceback.print_exc()
        # Devuelve 500 Internal Server Error en caso de otros errores
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor al obtener el aire acondicionado'}), 500

@aircontrol_bp.route('/api/aires', methods=['POST'])
@jwt_required()
def add_aire():
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data = request.get_json()
    nombre = data.get('nombre', '')
    ubicacion = data.get('ubicacion', '')
    fecha_instalacion = data.get('fecha_instalacion', '')
    tipo = data.get('tipo', '')
    toneladas = data.get('toneladas', 0)
    evaporadora_operativa = data.get('evaporadora_operativa', True)
    evaporadora_marca = data.get('evaporadora_marca', '')
    evaporadora_modelo = data.get('evaporadora_modelo', '')
    evaporadora_serial = data.get('evaporadora_serial', '')
    evaporadora_codigo_inventario = data.get('evaporadora_codigo_inventario', '')
    evaporadora_ubicacion_instalacion = data.get('evaporadora_ubicacion_instalacion', '')
    condensadora_operativa = data.get('condensadora_operativa', True)
    condensadora_marca = data.get('condensadora_marca', '')
    condensadora_modelo = data.get('condensadora_modelo', '')
    condensadora_serial = data.get('condensadora_serial', '')
    condensadora_codigo_inventario = data.get('condensadora_codigo_inventario', '')
    condensadora_ubicacion_instalacion = data.get('condensadora_ubicacion_instalacion', '')
    
    if not (nombre and ubicacion and fecha_instalacion): # Simplificado, ajusta si 'tipo' es realmente requerido
        return jsonify({'success': False, 'mensaje': 'Nombre, ubicación y fecha de instalación son requeridos'}), 400

    try:
        aire_id = data_manager.agregar_aire(
            nombre=nombre,
            ubicacion=ubicacion,
            fecha_instalacion=fecha_instalacion,
            tipo=tipo,
            toneladas=data.get('toneladas'), # Asegúrate que DataManager maneje None o 0
            evaporadora_operativa=data.get('evaporadora_operativa', True),
            evaporadora_marca=data.get('evaporadora_marca', ''),
            evaporadora_modelo=data.get('evaporadora_modelo', ''),
            evaporadora_serial=data.get('evaporadora_serial', ''),
            evaporadora_codigo_inventario=data.get('evaporadora_codigo_inventario', ''),
            evaporadora_ubicacion_instalacion=data.get('evaporadora_ubicacion_instalacion', ''),
            condensadora_operativa=data.get('condensadora_operativa', True),
            condensadora_marca=data.get('condensadora_marca', ''),
            condensadora_modelo=data.get('condensadora_modelo', ''),
            condensadora_serial=data.get('condensadora_serial', ''),
            condensadora_codigo_inventario=data.get('condensadora_codigo_inventario', ''),
            condensadora_ubicacion_instalacion=data.get('condensadora_ubicacion_instalacion', '')
        )
        
        if aire_id:
                        # Buscar el objeto recién creado para devolverlo completo
            nuevo_aire_obj = data_manager.obtener_aire_por_id(aire_id) # Necesitas este método en DataManager si no existe
            
            if nuevo_aire_obj:
                # Convertir el objeto SQLAlchemy a un diccionario JSON serializable
                # (Similar a como lo haces en get_aire_by_id)
                aire_dict = {
                    'id': nuevo_aire_obj.id,
                    'nombre': nuevo_aire_obj.nombre,
                    'ubicacion': nuevo_aire_obj.ubicacion,
                    'fecha_instalacion': nuevo_aire_obj.fecha_instalacion, # Asegúrate que el formato sea el esperado por el frontend
                    'tipo': nuevo_aire_obj.tipo,
                    'toneladas': float(nuevo_aire_obj.toneladas) if nuevo_aire_obj.toneladas is not None else None,
                    'evaporadora_operativa': bool(nuevo_aire_obj.evaporadora_operativa),
                    'evaporadora_marca': nuevo_aire_obj.evaporadora_marca,
                    'evaporadora_modelo': nuevo_aire_obj.evaporadora_modelo,
                    'evaporadora_serial': nuevo_aire_obj.evaporadora_serial,
                    'evaporadora_codigo_inventario': nuevo_aire_obj.evaporadora_codigo_inventario,
                    'evaporadora_ubicacion_instalacion': nuevo_aire_obj.evaporadora_ubicacion_instalacion,
                    'condensadora_operativa': bool(nuevo_aire_obj.condensadora_operativa),
                    'condensadora_marca': nuevo_aire_obj.condensadora_marca,
                    'condensadora_modelo': nuevo_aire_obj.condensadora_modelo,
                    'condensadora_serial': nuevo_aire_obj.condensadora_serial,
                    'condensadora_codigo_inventario': nuevo_aire_obj.condensadora_codigo_inventario,
                    'condensadora_ubicacion_instalacion': nuevo_aire_obj.condensadora_ubicacion_instalacion,
                    # Añade cualquier otro campo que necesite el frontend
                }
                # Devolver el objeto completo, idealmente dentro de una clave 'data'
                # y con el código de estado 201 Created
                return jsonify({'success': True, 'mensaje': 'Aire acondicionado agregado exitosamente', 'data': aire_dict}), 201
            else:
                # Esto no debería pasar si aire_id es válido, pero por si acaso
                print(f"ERROR CRÍTICO: Aire con ID {aire_id} se creó pero no se pudo recuperar inmediatamente.", file=sys.stderr)
                # Devolver un error 500 Internal Server Error
                return jsonify({'success': False, 'mensaje': 'Error interno del servidor al recuperar el aire recién creado'}), 500
           
        else:
             # Esto no debería pasar si agregar_aire devolvió un ID válido
             print(f"ERROR CRÍTICO: Aire con ID {aire_id} creado pero no recuperado.", file=sys.stderr)
             return jsonify({'success': False, 'mensaje': 'Error interno del servidor al recuperar el aire recién creado'}), 500

    except ValueError as ve: # Captura el error de duplicado
        return jsonify({'success': False, 'mensaje': str(ve)}), 409 # 409 Conflict
    except ConnectionError as ce: # Captura error de BD
         return jsonify({'success': False, 'mensaje': str(ce)}), 500 # 500 Internal Server Error
    except Exception as e:
        print(f"Error inesperado en add_aire: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor al procesar la solicitud'}), 500

@aircontrol_bp.route('/api/aires/<int:aire_id>', methods=['PUT'])
@jwt_required()
def update_aire(aire_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data = request.get_json()
    nombre = data.get('nombre', '')
    ubicacion = data.get('ubicacion', '')
    fecha_instalacion = data.get('fecha_instalacion', '')
    tipo = data.get('tipo', '')
    toneladas = data.get('toneladas', 0)
    evaporadora_operativa = data.get('evaporadora_operativa', True)
    evaporadora_marca = data.get('evaporadora_marca', '')
    evaporadora_modelo = data.get('evaporadora_modelo', '')
    evaporadora_serial = data.get('evaporadora_serial', '')
    evaporadora_codigo_inventario = data.get('evaporadora_codigo_inventario', '')
    evaporadora_ubicacion_instalacion = data.get('evaporadora_ubicacion_instalacion', '')
    condensadora_operativa = data.get('condensadora_operativa', True)
    condensadora_marca = data.get('condensadora_marca', '')
    condensadora_modelo = data.get('condensadora_modelo', '')
    condensadora_serial = data.get('condensadora_serial', '')
    condensadora_codigo_inventario = data.get('condensadora_codigo_inventario', '')
    condensadora_ubicacion_instalacion = data.get('condensadora_ubicacion_instalacion', '')
    
    if not (nombre and ubicacion and fecha_instalacion and tipo):
        return jsonify({'success': False, 'mensaje': 'Nombre, ubicación, fecha de instalación y tipo son requeridos'})
    
    try:
        actualizado = data_manager.actualizar_aire(
            aire_id=aire_id,
            # ... (pasar todos los argumentos) ...
        )
        if actualizado:
            # Devolver el objeto actualizado (opcional pero recomendado)
            aire_obj_actualizado = data_manager.obtener_aire_por_id(aire_id)
            if aire_obj_actualizado:
                 aire_dict = { # ... construir aire_dict ...
                    'id': aire_obj_actualizado.id,
                    'nombre': aire_obj_actualizado.nombre,
                    'ubicacion': aire_obj_actualizado.ubicacion,
                    'fecha_instalacion': aire_obj_actualizado.fecha_instalacion.strftime('%Y-%m-%d') if aire_obj_actualizado.fecha_instalacion else None, # Formatear fecha
                    'tipo': aire_obj_actualizado.tipo,
                    'toneladas': float(aire_obj_actualizado.toneladas) if aire_obj_actualizado.toneladas is not None else None,
                    'evaporadora_operativa': bool(aire_obj_actualizado.evaporadora_operativa),
                    'evaporadora_marca': aire_obj_actualizado.evaporadora_marca,
                    'evaporadora_modelo': aire_obj_actualizado.evaporadora_modelo,
                    'evaporadora_serial': aire_obj_actualizado.evaporadora_serial,
                    'evaporadora_codigo_inventario': aire_obj_actualizado.evaporadora_codigo_inventario,
                    'evaporadora_ubicacion_instalacion': aire_obj_actualizado.evaporadora_ubicacion_instalacion,
                    'condensadora_operativa': bool(aire_obj_actualizado.condensadora_operativa),
                    'condensadora_marca': aire_obj_actualizado.condensadora_marca,
                    'condensadora_modelo': aire_obj_actualizado.condensadora_modelo,
                    'condensadora_serial': aire_obj_actualizado.condensadora_serial,
                    'condensadora_codigo_inventario': aire_obj_actualizado.condensadora_codigo_inventario,
                    'condensadora_ubicacion_instalacion': aire_obj_actualizado.condensadora_ubicacion_instalacion,
                 }
                 return jsonify({'success': True, 'mensaje': 'Aire acondicionado actualizado exitosamente', 'data': aire_dict}), 200
            else:
                 # Si no se encontró después de actualizar (raro)
                 return jsonify({'success': False, 'mensaje': 'Aire no encontrado después de la actualización'}), 404
        else:
             # Si actualizar_aire devolvió False (probablemente no encontró el ID inicial)
             return jsonify({'success': False, 'mensaje': 'Aire acondicionado no encontrado para actualizar'}), 404

    except ValueError as ve: # Captura el error de duplicado
        return jsonify({'success': False, 'mensaje': str(ve)}), 409 # 409 Conflict
    except ConnectionError as ce: # Captura error de BD
         return jsonify({'success': False, 'mensaje': str(ce)}), 500 # 500 Internal Server Error
    except Exception as e:
        print(f"Error inesperado en update_aire {aire_id}: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor al actualizar el aire'}), 500


@aircontrol_bp.route('/api/aires/<int:aire_id>', methods=['DELETE'])
@jwt_required()
def delete_aire(aire_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data_manager.eliminar_aire(aire_id)
    return jsonify({'success': True, 'mensaje': 'Aire acondicionado eliminado exitosamente'})

@aircontrol_bp.route('/api/otros-equipos', methods=['GET'])
@jwt_required()
def get_otros_equipos():
    """Obtiene la lista de otros equipos."""
    try:
        equipos_df = data_manager.obtener_otros_equipos()
        if equipos_df.empty:
            return jsonify([]) # Devuelve lista vacía si no hay datos

        # Convertir DataFrame a lista de diccionarios para JSON
        # Asegúrate de que los tipos sean serializables (fechas a string, etc.)
        # El DataManager ya debería haber formateado las fechas y booleanos
        equipos_list = equipos_df.to_dict(orient='records')

        # Conversión explícita por si acaso (especialmente IDs y floats)
        for equipo in equipos_list:
            equipo['id'] = int(equipo['id'])
            # Añade otras conversiones si son necesarias (ej. floats)

        return jsonify(equipos_list)
    except Exception as e:
        print(f"Error en get_otros_equipos: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno al obtener otros equipos'}), 500

@aircontrol_bp.route('/api/otros-equipos/<int:equipo_id>', methods=['GET'])
@jwt_required()
def get_otro_equipo_by_id(equipo_id):
    """Obtiene los detalles de un equipo específico por su ID."""
    try:
        equipo_obj = data_manager.obtener_otro_equipo_por_id(equipo_id)
        if equipo_obj:
            # Convertir objeto SQLAlchemy a diccionario serializable
            equipo_dict = {
                'id': equipo_obj.id,
                'nombre': equipo_obj.nombre,
                'tipo': equipo_obj.tipo,
                'ubicacion': equipo_obj.ubicacion,
                'marca': equipo_obj.marca,
                'modelo': equipo_obj.modelo,
                'serial': equipo_obj.serial,
                'codigo_inventario': equipo_obj.codigo_inventario,
                'fecha_instalacion': equipo_obj.fecha_instalacion.strftime('%Y-%m-%d') if equipo_obj.fecha_instalacion else None,
                'estado_operativo': bool(equipo_obj.estado_operativo),
                'notas': equipo_obj.notas,
                'fecha_creacion': equipo_obj.fecha_creacion.strftime('%Y-%m-%d %H:%M:%S'),
                'ultima_modificacion': equipo_obj.ultima_modificacion.strftime('%Y-%m-%d %H:%M:%S')
            }
            return jsonify(equipo_dict)
        else:
            return jsonify({'success': False, 'mensaje': 'Equipo no encontrado'}), 404
    except Exception as e:
        print(f"Error en get_otro_equipo_by_id para ID {equipo_id}: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno al obtener el equipo'}), 500

@aircontrol_bp.route('/api/otros-equipos', methods=['POST'])
@jwt_required()
def add_otro_equipo():
    """Agrega un nuevo equipo diverso."""
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'mensaje': 'No se recibieron datos JSON'}), 400

    # Campos requeridos y opcionales
    nombre = data.get('nombre')
    tipo = data.get('tipo') # Ej: 'Motogenerador', 'UPS', 'PDU'

    if not nombre or not tipo:
        return jsonify({'success': False, 'mensaje': 'Nombre y Tipo son requeridos'}), 400

    # Validar tipo (opcional pero recomendado)
    allowed_types = ['Motogenerador', 'UPS', 'PDU', 'Otro'] # Define tus tipos permitidos
    if tipo not in allowed_types:
         return jsonify({'success': False, 'mensaje': f"Tipo '{tipo}' no es válido. Permitidos: {', '.join(allowed_types)}"}), 400

    # Obtener otros campos (usar .get con default None o valor apropiado)
    ubicacion = data.get('ubicacion')
    marca = data.get('marca')
    modelo = data.get('modelo')
    serial = data.get('serial')
    codigo_inventario = data.get('codigo_inventario')
    fecha_instalacion = data.get('fecha_instalacion') # Espera 'YYYY-MM-DD' o None/null
    estado_operativo = data.get('estado_operativo', True) # Default a True si no se envía
    notas = data.get('notas')

    try:
        equipo_id = data_manager.agregar_otro_equipo(
            nombre=nombre,
            tipo=tipo,
            ubicacion=ubicacion,
            marca=marca,
            modelo=modelo,
            serial=serial,
            codigo_inventario=codigo_inventario,
            fecha_instalacion=fecha_instalacion,
            estado_operativo=estado_operativo,
            notas=notas
        )

        if equipo_id:
            # Devolver el objeto recién creado (Buena práctica REST)
            nuevo_equipo_obj = data_manager.obtener_otro_equipo_por_id(equipo_id)
            if nuevo_equipo_obj:
                 equipo_dict = {
                    'id': nuevo_equipo_obj.id,
                    'nombre': nuevo_equipo_obj.nombre,
                    'tipo': nuevo_equipo_obj.tipo,
                    'ubicacion': nuevo_equipo_obj.ubicacion,
                    'marca': nuevo_equipo_obj.marca,
                    'modelo': nuevo_equipo_obj.modelo,
                    'serial': nuevo_equipo_obj.serial,
                    'codigo_inventario': nuevo_equipo_obj.codigo_inventario,
                    'fecha_instalacion': nuevo_equipo_obj.fecha_instalacion.strftime('%Y-%m-%d') if nuevo_equipo_obj.fecha_instalacion else None,
                    'estado_operativo': bool(nuevo_equipo_obj.estado_operativo),
                    'notas': nuevo_equipo_obj.notas
                 }
                 return jsonify({'success': True, 'mensaje': 'Equipo agregado exitosamente', 'data': equipo_dict}), 201
            else:
                 # Fallback si no se pudo recuperar inmediatamente
                 print(f"ADVERTENCIA: Equipo con ID {equipo_id} creado pero no recuperado.", file=sys.stderr)
                 return jsonify({'success': True, 'mensaje': 'Equipo agregado, pero no se pudo recuperar el objeto completo.', 'id': equipo_id}), 201

        else:
            # Error probable por duplicado (serial/inventario) u otro error de BD
             return jsonify({'success': False, 'mensaje': 'Error al agregar el equipo. Verifique que el serial o código de inventario no estén duplicados.'}), 409 # 409 Conflict

    except Exception as e:
        print(f"Error inesperado en add_otro_equipo: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor al procesar la solicitud'}), 500

@aircontrol_bp.route('/api/otros-equipos/<int:equipo_id>', methods=['PUT'])
@jwt_required()
def update_otro_equipo(equipo_id):
    """Actualiza un equipo diverso existente."""
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'mensaje': 'No se recibieron datos JSON'}), 400

    # Validar campos requeridos para la actualización (al menos nombre y tipo)
    nombre = data.get('nombre')
    tipo = data.get('tipo')
    if not nombre or not tipo:
        return jsonify({'success': False, 'mensaje': 'Nombre y Tipo son requeridos para la actualización'}), 400

    # Validar tipo (opcional pero recomendado)
    allowed_types = ['Motogenerador', 'UPS', 'PDU', 'Otro']
    if tipo not in allowed_types:
         return jsonify({'success': False, 'mensaje': f"Tipo '{tipo}' no es válido. Permitidos: {', '.join(allowed_types)}"}), 400

    # Crear diccionario con los datos a actualizar (solo los presentes en el request)
    update_data = {}
    allowed_keys = ['nombre', 'tipo', 'ubicacion', 'marca', 'modelo', 'serial',
                    'codigo_inventario', 'fecha_instalacion', 'estado_operativo', 'notas']
    for key in allowed_keys:
        if key in data:
            update_data[key] = data[key]

    try:
        actualizado = data_manager.actualizar_otro_equipo(equipo_id, **update_data)

        if actualizado:
             # Devolver el objeto actualizado
            equipo_obj_actualizado = data_manager.obtener_otro_equipo_por_id(equipo_id)
            if equipo_obj_actualizado:
                 equipo_dict = {
                    'id': equipo_obj_actualizado.id,
                    'nombre': equipo_obj_actualizado.nombre,
                    'tipo': equipo_obj_actualizado.tipo,
                    'ubicacion': equipo_obj_actualizado.ubicacion,
                    'marca': equipo_obj_actualizado.marca,
                    'modelo': equipo_obj_actualizado.modelo,
                    'serial': equipo_obj_actualizado.serial,
                    'codigo_inventario': equipo_obj_actualizado.codigo_inventario,
                    'fecha_instalacion': equipo_obj_actualizado.fecha_instalacion.strftime('%Y-%m-%d') if equipo_obj_actualizado.fecha_instalacion else None,
                    'estado_operativo': bool(equipo_obj_actualizado.estado_operativo),
                    'notas': equipo_obj_actualizado.notas
                 }
                 return jsonify({'success': True, 'mensaje': 'Equipo actualizado exitosamente', 'data': equipo_dict})
            else:
                 return jsonify({'success': True, 'mensaje': 'Equipo actualizado, pero no se pudo recuperar el objeto completo.'})
        else:
            # Podría ser que el equipo no exista (404) o error de integridad (409)
            equipo_existente = data_manager.obtener_otro_equipo_por_id(equipo_id)
            if not equipo_existente:
                 return jsonify({'success': False, 'mensaje': 'Equipo no encontrado para actualizar'}), 404
            else:
                 return jsonify({'success': False, 'mensaje': 'Error al actualizar el equipo (posible serial/código inventario duplicado)'}), 409

    except Exception as e:
        print(f"Error inesperado en update_otro_equipo {equipo_id}: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor al actualizar el equipo'}), 500

@aircontrol_bp.route('/api/otros-equipos/<int:equipo_id>', methods=['DELETE'])
@jwt_required()
def delete_otro_equipo(equipo_id):
    """Elimina un equipo diverso."""
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403

    try:
        eliminado = data_manager.eliminar_otro_equipo(equipo_id)
        if eliminado:
            return jsonify({'success': True, 'mensaje': 'Equipo eliminado exitosamente'})
        else:
            # Probablemente no se encontró el equipo
            return jsonify({'success': False, 'mensaje': 'Equipo no encontrado para eliminar'}), 404
    except Exception as e:
        print(f"Error inesperado en delete_otro_equipo {equipo_id}: {e}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor al eliminar el equipo'}), 500



# Rutas para lecturas
@aircontrol_bp.route('/api/lecturas', methods=['GET'])
@jwt_required()
def get_lecturas():
    aire_id = request.args.get('aire_id', type=int)
    
    if aire_id:
        lecturas_df = data_manager.obtener_lecturas_por_aire(aire_id)
    else:
        lecturas_df = data_manager.obtener_lecturas()
    
    if lecturas_df.empty:
        return jsonify({'success': True, 'data': []})
    
    lecturas = []
    for _, row in lecturas_df.iterrows():
        lecturas.append({
            'id': int(row['id']),
            'aire_id': int(row['aire_id']),
            'fecha': row['fecha'].strftime('%Y-%m-%d %H:%M:%S'),
            'temperatura': float(row['temperatura']),
            'humedad': float(row['humedad'])
        })
    
    return jsonify({'success': True, 'data': lecturas})

@aircontrol_bp.route('/api/lecturas', methods=['POST'])
@jwt_required()
def add_lectura():
    data = request.get_json()
    if not data:
         return jsonify({'success': False, 'mensaje': 'No se recibieron datos JSON'}), 400

    aire_id = data.get('aire_id')
    fecha_hora_str = data.get('fecha_hora') # <-- LEER 'fecha_hora'
    temperatura = data.get('temperatura')
    humedad = data.get('humedad')

    # Validación más robusta
    errors = {}
    if not aire_id: errors['aire_id'] = 'El ID del aire es requerido'
    if not fecha_hora_str: errors['fecha_hora'] = 'La fecha y hora son requeridas'
    if temperatura is None: errors['temperatura'] = 'La temperatura es requerida'
    if humedad is None: errors['humedad'] = 'La humedad es requerida'

    # Intentar convertir tipos y validar
    try:
        if aire_id: aire_id = int(aire_id)
    except (ValueError, TypeError):
        errors['aire_id'] = 'El ID del aire debe ser un número entero'

    try:
        if temperatura is not None: temperatura = float(temperatura)
    except (ValueError, TypeError):
         errors['temperatura'] = 'La temperatura debe ser un número'

    try:
        if humedad is not None: humedad = float(humedad)
    except (ValueError, TypeError):
         errors['humedad'] = 'La humedad debe ser un número'

    fecha_dt = None
    if fecha_hora_str:
        try:
            # Intenta parsear el formato esperado 'YYYY-MM-DD HH:MM:SS'
            fecha_dt = datetime.strptime(fecha_hora_str, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            errors['fecha_hora'] = "Formato de fecha y hora inválido. Use 'YYYY-MM-DD HH:MM:SS'"

    if errors:
        # Devolver 400 Bad Request si hay errores de validación
        return jsonify({'success': False, 'mensaje': 'Datos inválidos', 'errors': errors}), 400

    # Llamar al data_manager con los datos validados y convertidos
    lectura_id = data_manager.agregar_lectura(aire_id, fecha_dt, temperatura, humedad)

    if lectura_id:
        # Devolver 201 Created en éxito
        # También devuelve la fecha guardada para consistencia (opcional pero bueno)

        # --- CORRECCIÓN AQUÍ ---
        # Usa la 'session' importada directamente, no 'data_manager.session'
        try:
            lectura_guardada = session.query(Lectura).get(lectura_id) # Obtener la lectura recién guardada
            if lectura_guardada:
                fecha_guardada_str = lectura_guardada.fecha.strftime('%Y-%m-%d %H:%M:%S')
            else:
                # Fallback si por alguna razón no se encuentra la lectura (poco probable si lectura_id es válido)
                fecha_guardada_str = fecha_hora_str
                print(f"ADVERTENCIA: No se encontró la lectura recién guardada con ID {lectura_id} para obtener la fecha exacta.", file=sys.stderr)

            return jsonify({
                'success': True,
                'mensaje': 'Lectura registrada exitosamente',
                'id': lectura_id,
                'fecha': fecha_guardada_str # Devuelve la fecha como fue guardada
                }), 201
        except Exception as e:
            print(f"!!! ERROR al obtener la lectura recién guardada (ID: {lectura_id}): {e}", file=sys.stderr)
            traceback.print_exc()
            # Aún así, la lectura se guardó, podrías devolver éxito pero sin la fecha exacta
            return jsonify({
                'success': True,
                'mensaje': 'Lectura registrada, pero hubo un error al recuperar detalles.',
                'id': lectura_id
                }), 201 # O considera un 200 OK con advertencia

    else:
        # Devolver 500 Internal Server Error si data_manager falló
        return jsonify({'success': False, 'mensaje': 'Error interno al registrar la lectura'}), 500

@aircontrol_bp.route('/api/lecturas/<int:lectura_id>', methods=['DELETE'])
@jwt_required()
def delete_lectura(lectura_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') == 'operador':
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    resultado = data_manager.eliminar_lectura(lectura_id)
    
    if resultado:
        return jsonify({'success': True, 'mensaje': 'Lectura eliminada exitosamente'})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al eliminar la lectura'})

# Rutas para estadísticas
@aircontrol_bp.route('/api/estadisticas/general', methods=['GET'])
@jwt_required()
def get_estadisticas_general():
    stats = data_manager.obtener_estadisticas_generales()
    return jsonify(stats)

@aircontrol_bp.route('/api/estadisticas/aire/<int:aire_id>', methods=['GET'])
@jwt_required()
def get_estadisticas_aire(aire_id):
    stats = data_manager.obtener_estadisticas_por_aire(aire_id)
    return jsonify(stats)

@aircontrol_bp.route('/api/estadisticas/ubicacion', methods=['GET'])
@jwt_required()
def get_estadisticas_ubicacion():
    ubicacion = request.args.get('ubicacion')
    stats_df = data_manager.obtener_estadisticas_por_ubicacion(ubicacion)
    
    if stats_df.empty:
        return jsonify([])
    
    stats = []
    for _, row in stats_df.iterrows():
        stats_dict = {}
        for column in stats_df.columns:
            stats_dict[column] = row[column]
        stats.append(stats_dict)
    
    return jsonify(stats)

# Rutas para mantenimientos
@aircontrol_bp.route('/api/mantenimientos', methods=['GET'])
@jwt_required()
def get_mantenimientos():
    # --- CAMBIO: Aceptar ambos IDs como filtro ---
    aire_id = request.args.get('aire_id', type=int)
    otro_equipo_id = request.args.get('otro_equipo_id', type=int)
    # --- FIN CAMBIO ---

    # Pasar ambos filtros al DataManager (él decidirá cuál usar si ambos están presentes, o ninguno)
    mantenimientos_df = data_manager.obtener_mantenimientos(aire_id=aire_id, otro_equipo_id=otro_equipo_id)

    if mantenimientos_df.empty:
        return jsonify([])

    mantenimientos = []
    for _, row in mantenimientos_df.iterrows():
        mantenimiento = {
            'id': int(row['id']),
            # --- CAMBIO: Incluir ambos IDs y la info unificada ---
            'aire_id': int(row['aire_id']) if pd.notna(row['aire_id']) and row['aire_id'] != 0 else None,
            'otro_equipo_id': int(row['otro_equipo_id']) if pd.notna(row['otro_equipo_id']) and row['otro_equipo_id'] != 0 else None,
            'equipo_nombre': row['equipo_nombre'],
            'equipo_ubicacion': row['equipo_ubicacion'],
            'equipo_tipo': row['equipo_tipo'],
            # --- FIN CAMBIO ---
            'fecha': row['fecha'].strftime('%Y-%m-%d %H:%M:%S'), # Formatear fecha aquí
            'tipo_mantenimiento': row['tipo_mantenimiento'],
            'descripcion': row['descripcion'],
            'tecnico': row['tecnico'],
            'tiene_imagen': bool(row['tiene_imagen']) # Asegurar booleano
        }
        mantenimientos.append(mantenimiento)

    return jsonify(mantenimientos)

@aircontrol_bp.route('/api/mantenimientos', methods=['POST'])
@jwt_required()
def add_mantenimiento():
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403


    aire_id_str = request.form.get('aire_id')
    otro_equipo_id_str = request.form.get('otro_equipo_id')
   

    tipo_mantenimiento = request.form.get('tipo_mantenimiento')
    descripcion = request.form.get('descripcion')
    tecnico = request.form.get('tecnico')
    imagen_file = request.files.get('imagen_file')

    # Validar que se proporcionó uno y solo uno de los IDs
    aire_id = None
    otro_equipo_id = None
    target_provided = False
    if aire_id_str:
        try:
            aire_id = int(aire_id_str)
            target_provided = True
        except ValueError:
            return jsonify({'success': False, 'mensaje': 'aire_id debe ser un número entero'}), 400
    if otro_equipo_id_str:
        if target_provided: # Ya se proporcionó aire_id
             return jsonify({'success': False, 'mensaje': 'Proporcione aire_id O otro_equipo_id, no ambos'}), 400
        try:
            otro_equipo_id = int(otro_equipo_id_str)
            target_provided = True
        except ValueError:
            return jsonify({'success': False, 'mensaje': 'otro_equipo_id debe ser un número entero'}), 400

    if not target_provided:
        return jsonify({'success': False, 'mensaje': 'Debe proporcionar aire_id o otro_equipo_id'}), 400

    # Verificar otros campos requeridos
    if not (tipo_mantenimiento and descripcion and tecnico):
        return jsonify({'success': False, 'mensaje': 'Tipo de mantenimiento, descripción y técnico son requeridos'}), 400

    # Agregar mantenimiento usando el DataManager actualizado
    mantenimiento_id = data_manager.agregar_mantenimiento(
        aire_id=aire_id, # Pasa None si no se proporcionó
        otro_equipo_id=otro_equipo_id, # Pasa None si no se proporcionó
        tipo_mantenimiento=tipo_mantenimiento,
        descripcion=descripcion,
        tecnico=tecnico,
        imagen_file=imagen_file
    )

    if mantenimiento_id:
        # Devolver el objeto completo (similar a como lo tenías, pero adaptado)
        try:
            nuevo_mantenimiento_obj = data_manager.obtener_mantenimiento_por_id(mantenimiento_id)
            if nuevo_mantenimiento_obj:
                # Obtener info del equipo asociado (aire u otro)
                equipo_nombre = "Desconocido"
                equipo_ubicacion = "Desconocida"
                equipo_tipo = "Desconocido"

                if nuevo_mantenimiento_obj.aire_id:
                    aire_info = data_manager.obtener_aire_por_id(nuevo_mantenimiento_obj.aire_id)
                    if aire_info:
                        equipo_nombre = aire_info.nombre
                        equipo_ubicacion = aire_info.ubicacion
                        equipo_tipo = "Aire Acondicionado"
                elif nuevo_mantenimiento_obj.otro_equipo_id:
                    otro_equipo_info = data_manager.obtener_otro_equipo_por_id(nuevo_mantenimiento_obj.otro_equipo_id)
                    if otro_equipo_info:
                        equipo_nombre = otro_equipo_info.nombre
                        equipo_ubicacion = otro_equipo_info.ubicacion
                        equipo_tipo = otro_equipo_info.tipo

                respuesta_data = {
                    'id': nuevo_mantenimiento_obj.id,
                    'aire_id': nuevo_mantenimiento_obj.aire_id,
                    'otro_equipo_id': nuevo_mantenimiento_obj.otro_equipo_id,
                    'fecha': nuevo_mantenimiento_obj.fecha.strftime('%Y-%m-%d %H:%M:%S'),
                    'tipo_mantenimiento': nuevo_mantenimiento_obj.tipo_mantenimiento,
                    'descripcion': nuevo_mantenimiento_obj.descripcion,
                    'tecnico': nuevo_mantenimiento_obj.tecnico,
                    'tiene_imagen': nuevo_mantenimiento_obj.imagen_datos is not None,
                    'equipo_nombre': equipo_nombre,
                    'equipo_ubicacion': equipo_ubicacion,
                    'equipo_tipo': equipo_tipo
                }
                return jsonify({'success': True, 'mensaje': 'Mantenimiento registrado exitosamente', 'data': respuesta_data}), 201
            else:
                return jsonify({'success': False, 'mensaje': 'Mantenimiento guardado pero no se pudo recuperar'}), 500
        except Exception as e_fetch:
            print(f"Error al recuperar mantenimiento recién guardado {mantenimiento_id}: {e_fetch}")
            traceback.print_exc()
            return jsonify({'success': True, 'mensaje': 'Mantenimiento registrado, pero hubo un error al recuperar detalles.', 'id': mantenimiento_id}), 200
    else:
        return jsonify({'success': False, 'mensaje': 'Error al registrar el mantenimiento'}), 500


@aircontrol_bp.route('/api/mantenimientos/<int:mantenimiento_id>', methods=['DELETE'])
@jwt_required()
def delete_mantenimiento(mantenimiento_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    resultado = data_manager.eliminar_mantenimiento(mantenimiento_id)
    
    if resultado:
        return jsonify({'success': True, 'mensaje': 'Mantenimiento eliminado exitosamente'})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al eliminar el mantenimiento'})

@aircontrol_bp.route('/api/mantenimientos/<int:mantenimiento_id>/imagen', methods=['GET'])
@jwt_required()
def get_mantenimiento_imagen(mantenimiento_id):
    try:
        # Llamar a un nuevo método en data_manager para obtener la imagen base64
        imagen_base64 = data_manager.obtener_imagen_mantenimiento_base64(mantenimiento_id)

        if imagen_base64:
            return jsonify({'success': True, 'imagen_base64': imagen_base64})
        else:
            # Puede que el mantenimiento no exista o no tenga imagen
            return jsonify({'success': False, 'mensaje': 'Imagen no encontrada para este mantenimiento'}), 404

    except Exception as e:
        print(f"Error al obtener imagen de mantenimiento {mantenimiento_id}: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno al obtener la imagen'}), 500

# Rutas para umbrales
# app.py - get_umbrales (Corregido)
@aircontrol_bp.route('/api/umbrales', methods=['GET'])
@jwt_required()
def get_umbrales():
    aire_id = request.args.get('aire_id', type=int)
    solo_globales = request.args.get('solo_globales', type=bool, default=False)
    
    umbrales_df = data_manager.obtener_umbrales_configuracion(aire_id, solo_globales)
    
    # Devolver estructura consistente incluso si está vacío
    if umbrales_df.empty:
        return jsonify({'success': True, 'data': []}) # Envuelto en {'data': []}
    
    umbrales = []
    # Obtener todos los aires una vez para eficiencia si hay umbrales específicos
    aires_dict = {}
    if not umbrales_df[umbrales_df['es_global'] == False].empty:
         aires_df = data_manager.obtener_aires()
         aires_dict = {row['id']: {'nombre': row['nombre'], 'ubicacion': row['ubicacion']} for _, row in aires_df.iterrows()}

    for _, row in umbrales_df.iterrows():
        umbral = {
            'id': int(row['id']),
            'nombre': row['nombre'],
            'es_global': bool(row['es_global']),
            'temp_min': float(row['temp_min']),
            'temp_max': float(row['temp_max']),
            'hum_min': float(row['hum_min']),
            'hum_max': float(row['hum_max']),
            'notificar_activo': bool(row['notificar_activo'])
        }
        
        # Añadir info del aire si es específico y existe
        if not row['es_global']:
            aire_id_int = int(row['aire_id'])
            umbral['aire_id'] = aire_id_int
            if aire_id_int in aires_dict:
                umbral['aire_nombre'] = aires_dict[aire_id_int]['nombre']
                umbral['ubicacion'] = aires_dict[aire_id_int]['ubicacion']
            else:
                 umbral['aire_nombre'] = 'Desconocido (ID no encontrado)'
                 umbral['ubicacion'] = 'Desconocida'

        umbrales.append(umbral)
    
    # Devolver la lista dentro de la clave 'data'
    return jsonify({'success': True, 'data': umbrales})


@aircontrol_bp.route('/api/umbrales', methods=['POST'])
@jwt_required()
def add_umbral():
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data = request.get_json()
    nombre = data.get('nombre')
    es_global = data.get('es_global', False)
    temp_min = data.get('temp_min')
    temp_max = data.get('temp_max')
    hum_min = data.get('hum_min')
    hum_max = data.get('hum_max')
    notificar_activo = data.get('notificar_activo', True)
    aire_id = data.get('aire_id') if not es_global else None
    
    # Verificar datos requeridos
    if not nombre:
        return jsonify({'success': False, 'mensaje': 'El nombre es requerido'})
    
    if temp_min is None or temp_max is None or hum_min is None or hum_max is None:
        return jsonify({'success': False, 'mensaje': 'Todos los umbrales son requeridos'})
    
    if not es_global and not aire_id:
        return jsonify({'success': False, 'mensaje': 'Se requiere un aire acondicionado para umbrales específicos'})
    
    # Validar valores de umbrales
    if temp_min >= temp_max or hum_min >= hum_max:
        return jsonify({'success': False, 'mensaje': 'Los valores mínimos deben ser menores que los máximos'})
    
    # Crear umbral
    umbral_id = data_manager.crear_umbral_configuracion(
        nombre=nombre,
        es_global=es_global,
        temp_min=temp_min,
        temp_max=temp_max,
        hum_min=hum_min,
        hum_max=hum_max,
        aire_id=aire_id,
        notificar_activo=notificar_activo
    )
    
    if umbral_id:
        return jsonify({'success': True, 'mensaje': 'Umbral configurado exitosamente', 'id': umbral_id})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al configurar el umbral'})

@aircontrol_bp.route('/api/umbrales/<int:umbral_id>', methods=['PUT'])
@jwt_required()
def update_umbral(umbral_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data = request.get_json()
    nombre = data.get('nombre')
    temp_min = data.get('temp_min')
    temp_max = data.get('temp_max')
    hum_min = data.get('hum_min')
    hum_max = data.get('hum_max')
    notificar_activo = data.get('notificar_activo', True)
    
    # Verificar datos requeridos
    if not nombre:
        return jsonify({'success': False, 'mensaje': 'El nombre es requerido'})
    
    if temp_min is None or temp_max is None or hum_min is None or hum_max is None:
        return jsonify({'success': False, 'mensaje': 'Todos los umbrales son requeridos'})
    
    # Validar valores de umbrales
    if temp_min >= temp_max or hum_min >= hum_max:
        return jsonify({'success': False, 'mensaje': 'Los valores mínimos deben ser menores que los máximos'})
    
    # Actualizar umbral
    actualizado = data_manager.actualizar_umbral_configuracion(
        umbral_id=umbral_id,
        nombre=nombre,
        temp_min=temp_min,
        temp_max=temp_max,
        hum_min=hum_min,
        hum_max=hum_max,
        notificar_activo=notificar_activo
    )
    
    if actualizado:
        return jsonify({'success': True, 'mensaje': 'Umbral actualizado exitosamente'})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al actualizar el umbral'})

@aircontrol_bp.route('/api/umbrales/<int:umbral_id>', methods=['DELETE'])
@jwt_required()
def delete_umbral(umbral_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    resultado = data_manager.eliminar_umbral_configuracion(umbral_id)
    
    if resultado:
        return jsonify({'success': True, 'mensaje': 'Umbral eliminado exitosamente'})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al eliminar el umbral'})

# Rutas para usuarios
@aircontrol_bp.route('/api/usuarios', methods=['GET'])
@jwt_required()
def get_usuarios():
    jwt_data = get_jwt()
    if jwt_data.get('rol') != 'admin':
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    solo_activos = request.args.get('solo_activos', default=True, type=lambda v: v.lower() == 'true')
    usuarios_df = data_manager.obtener_usuarios(solo_activos)
    
    if usuarios_df.empty:
        return jsonify([])
    
    usuarios = []
    for _, row in usuarios_df.iterrows():
        usuario = {
            'id': int(row['id']),
            'nombre': row['nombre'],
            'apellido': row['apellido'],
            'email': row['email'],
            'username': row['username'],
            'rol': row['rol'],
            'activo': bool(row['activo']),
            'fecha_registro': row['fecha_registro'].strftime('%Y-%m-%d %H:%M:%S') if pd.notna(row['fecha_registro']) else None
        }
        
        if 'ultima_conexion' in row and pd.notna(row['ultima_conexion']):
            usuario['ultima_conexion'] = row['ultima_conexion'].strftime('%Y-%m-%d %H:%M:%S')
        
        usuarios.append(usuario)
    
    return jsonify(usuarios)

@aircontrol_bp.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
@jwt_required()
def update_usuario(usuario_id):
    try:
        # Get JWT identity and claims
        current_user_id = get_jwt_identity()
        jwt_data = get_jwt()
        
        # Check admin role
        if not jwt_data or jwt_data.get('rol') != 'admin':
            return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403

        data = request.get_json()
        nombre = data.get('nombre')
        apellido = data.get('apellido')
        email = data.get('email')
        rol = data.get('rol')
        activo = data.get('activo')

        # Validate required fields
        if not (nombre and apellido and email and rol) or activo is None:
            return jsonify({'success': False, 'mensaje': 'Todos los campos (nombre, apellido, email, rol, activo) son requeridos'}), 400

        # Validate role value
        if rol not in ['admin', 'supervisor', 'operador']:
            return jsonify({'success': False, 'mensaje': f"Rol '{rol}' inválido. Roles permitidos: admin, supervisor, operador"}), 400

        # Update user
        actualizado = data_manager.actualizar_usuario(
            usuario_id=usuario_id,
            nombre=nombre,
            apellido=apellido,
            email=email,
            rol=rol,
            activo=activo
        )

        if actualizado:
            return jsonify({'success': True, 'mensaje': 'Usuario actualizado exitosamente'})
        return jsonify({'success': False, 'mensaje': 'Error al actualizar el usuario'}), 500

    except Exception as e:
        print(f"Error in update_usuario: {str(e)}")
        return jsonify({'success': False, 'mensaje': 'Error interno del servidor'}), 500

# ---  RUTA PARA EL RESUMEN DEL DASHBOARD ---
@aircontrol_bp.route('/api/dashboard/resumen', methods=['GET'])
@jwt_required()
def get_dashboard_resumen():
    try:
        total_aires = data_manager.contar_aires()
        # --- CAMBIO: Añadir conteo de otros equipos ---
        total_otros_equipos = data_manager.contar_otros_equipos()
        # --- FIN CAMBIO ---
        total_lecturas = data_manager.contar_lecturas()
        total_mantenimientos = data_manager.contar_mantenimientos() # Este método ya cuenta todos
        alertas_activas = data_manager.contar_alertas_activas()
        ultimas_lecturas_df = data_manager.obtener_ultimas_lecturas_con_info_aire(limite=5)

        ultimas_lecturas_lista = []
        # ... (código para procesar ultimas_lecturas_df sin cambios) ...
        if not ultimas_lecturas_df.empty:
             for _, row in ultimas_lecturas_df.iterrows():
                 ultimas_lecturas_lista.append({
                     'id': int(row['id']),
                     'aire_id': int(row['aire_id']),
                     'nombre': row['nombre_aire'],
                     'ubicacion': row['ubicacion_aire'],
                     'temperatura': float(row['temperatura']),
                     'humedad': float(row['humedad']),
                     'fecha': row['fecha'].strftime('%Y-%m-%d %H:%M:%S')
                 })


        resumen_data = {
            'totalAires': total_aires,
            # --- CAMBIO: Incluir total de otros equipos ---
            'totalOtrosEquipos': total_otros_equipos,
            # --- FIN CAMBIO ---
            'totalLecturas': total_lecturas,
            'totalMantenimientos': total_mantenimientos,
            'alertas': alertas_activas,
            'ultimasLecturas': ultimas_lecturas_lista
        }
        return jsonify(resumen_data)
    except Exception as e:
        print(f"Error al generar resumen del dashboard: {e}")
        traceback.print_exc()
        return jsonify({'success': False, 'mensaje': 'Error interno al obtener el resumen del dashboard'}), 500

# Registrar el Blueprint con el prefijo /aircontrol
app.register_blueprint(aircontrol_bp, url_prefix='/aircontrol')

# Iniciar servidor
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)