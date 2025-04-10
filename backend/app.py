from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, 
    create_access_token, 
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta
import pandas as pd
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
print("\n=== Environment Variables ===")
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL')}")
print(f"SECRET_KEY: {os.environ.get('SECRET_KEY')}")
print(f"JWT_SECRET_KEY: {os.environ.get('JWT_SECRET_KEY')}\n")

# Añadir el directorio principal al path para importar los módulos de database y data_manager
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.data_manager import DataManager
from backend.database import init_db, Usuario

# Inicializar la aplicación Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clave_secreta_para_desarrollo')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt_clave_secreta_para_desarrollo')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Habilitar CORS para permitir solicitudes desde el frontend
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Inicializar JWT
jwt = JWTManager(app)

# Configurar manejadores de errores para JWT
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print("\n=== JWT Validation Failed ===")
    print(f"Error: {error}")
    print(f"Authorization Header: {request.headers.get('Authorization')}")
    print(f"Current JWT_SECRET_KEY: {app.config['JWT_SECRET_KEY']}")
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
@app.route('/')
def index():
    return jsonify({"mensaje": "API de Monitoreo AC funcionando"})

# Rutas de autenticación
@app.route('/api/auth/login', methods=['POST'])
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

@app.route('/api/auth/register', methods=['POST'])
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

@app.route('/api/admin/users', methods=['POST']) # Nueva ruta específica para admin
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
    password = data.get('password') # Considera si el admin debe poner una contraseña o si se genera una temporal
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

@app.route('/api/auth/user', methods=['GET'])
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
@app.route('/api/aires', methods=['GET'])
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
            'fecha_instalacion': row['fecha_instalacion']
        })
    
    return jsonify(aires)

@app.route('/api/aires', methods=['POST'])
@jwt_required()
def add_aire():
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data = request.get_json()
    nombre = data.get('nombre', '')
    ubicacion = data.get('ubicacion', '')
    fecha_instalacion = data.get('fecha_instalacion', '')
    
    if not (nombre and ubicacion and fecha_instalacion):
        return jsonify({'success': False, 'mensaje': 'Todos los campos son requeridos'})
    
    aire_id = data_manager.agregar_aire(nombre, ubicacion, fecha_instalacion)
    
    if aire_id:
        return jsonify({'success': True, 'mensaje': 'Aire acondicionado agregado exitosamente', 'id': aire_id})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al agregar el aire acondicionado'})

@app.route('/api/aires/<int:aire_id>', methods=['PUT'])
@jwt_required()
def update_aire(aire_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data = request.get_json()
    nombre = data.get('nombre', '')
    ubicacion = data.get('ubicacion', '')
    fecha_instalacion = data.get('fecha_instalacion', '')
    
    if not (nombre and ubicacion and fecha_instalacion):
        return jsonify({'success': False, 'mensaje': 'Todos los campos son requeridos'})
    
    actualizado = data_manager.actualizar_aire(aire_id, nombre, ubicacion, fecha_instalacion)
    
    if actualizado:
        return jsonify({'success': True, 'mensaje': 'Aire acondicionado actualizado exitosamente'})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al actualizar el aire acondicionado'})

@app.route('/api/aires/<int:aire_id>', methods=['DELETE'])
@jwt_required()
def delete_aire(aire_id):
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    data_manager.eliminar_aire(aire_id)
    return jsonify({'success': True, 'mensaje': 'Aire acondicionado eliminado exitosamente'})

# Rutas para lecturas
@app.route('/api/lecturas', methods=['GET'])
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

@app.route('/api/lecturas', methods=['POST'])
@jwt_required()
def add_lectura():
    data = request.get_json()
    aire_id = data.get('aire_id')
    fecha_str = data.get('fecha')
    hora_str = data.get('hora')
    temperatura = data.get('temperatura')
    humedad = data.get('humedad')
    
    if not (aire_id and fecha_str and hora_str and temperatura is not None and humedad is not None):
        return jsonify({'success': False, 'mensaje': 'Todos los campos son requeridos'})
    
    fecha_hora_str = f"{fecha_str} {hora_str}"
    fecha_dt = pd.to_datetime(fecha_hora_str)
    
    lectura_id = data_manager.agregar_lectura(aire_id, fecha_dt, temperatura, humedad)
    
    if lectura_id:
        return jsonify({'success': True, 'mensaje': 'Lectura registrada exitosamente', 'id': lectura_id})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al registrar la lectura'})

@app.route('/api/lecturas/<int:lectura_id>', methods=['DELETE'])
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
@app.route('/api/estadisticas/general', methods=['GET'])
@jwt_required()
def get_estadisticas_general():
    stats = data_manager.obtener_estadisticas_generales()
    return jsonify(stats)

@app.route('/api/estadisticas/aire/<int:aire_id>', methods=['GET'])
@jwt_required()
def get_estadisticas_aire(aire_id):
    stats = data_manager.obtener_estadisticas_por_aire(aire_id)
    return jsonify(stats)

@app.route('/api/estadisticas/ubicacion', methods=['GET'])
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
@app.route('/api/mantenimientos', methods=['GET'])
@jwt_required()
def get_mantenimientos():
    aire_id = request.args.get('aire_id', type=int)
    mantenimientos_df = data_manager.obtener_mantenimientos(aire_id)
    
    if mantenimientos_df.empty:
        return jsonify([])
    
    mantenimientos = []
    for _, row in mantenimientos_df.iterrows():
        mantenimiento = {
            'id': int(row['id']),
            'aire_id': int(row['aire_id']),
            'fecha': row['fecha'].strftime('%Y-%m-%d %H:%M:%S'),
            'tipo_mantenimiento': row['tipo_mantenimiento'],
            'descripcion': row['descripcion'],
            'tecnico': row['tecnico']
        }
        
        # Obtener imagen base64 si está disponible
        if 'imagen_datos' in row and row['imagen_datos']:
            mantenimiento['imagen'] = row['imagen_base64'] if 'imagen_base64' in row else None
        
        mantenimientos.append(mantenimiento)
    
    return jsonify(mantenimientos)

@app.route('/api/mantenimientos', methods=['POST'])
@jwt_required()
def add_mantenimiento():
    jwt_data = get_jwt()
    if jwt_data.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    # Obtener datos del formulario
    aire_id = request.form.get('aire_id', type=int)
    tipo_mantenimiento = request.form.get('tipo_mantenimiento')
    descripcion = request.form.get('descripcion')
    tecnico = request.form.get('tecnico')
    
    # Verificar datos requeridos
    if not (aire_id and tipo_mantenimiento and descripcion and tecnico):
        return jsonify({'success': False, 'mensaje': 'Todos los campos son requeridos'})
    
    # Obtener archivo de imagen si está presente
    imagen_file = request.files.get('imagen_file')
    
    # Agregar mantenimiento
    mantenimiento_id = data_manager.agregar_mantenimiento(
        aire_id=aire_id,
        tipo_mantenimiento=tipo_mantenimiento,
        descripcion=descripcion,
        tecnico=tecnico,
        imagen_file=imagen_file
    )
    
    if mantenimiento_id:
        return jsonify({'success': True, 'mensaje': 'Mantenimiento registrado exitosamente', 'id': mantenimiento_id})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al registrar el mantenimiento'})

@app.route('/api/mantenimientos/<int:mantenimiento_id>', methods=['DELETE'])
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

# Rutas para umbrales
# app.py - get_umbrales (Corregido)
@app.route('/api/umbrales', methods=['GET'])
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


@app.route('/api/umbrales', methods=['POST'])
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

@app.route('/api/umbrales/<int:umbral_id>', methods=['PUT'])
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

@app.route('/api/umbrales/<int:umbral_id>', methods=['DELETE'])
@jwt_required()
def delete_umbral(umbral_id):
    current_user = get_jwt_identity()
    if current_user.get('rol') not in ['admin', 'supervisor']:
        return jsonify({'success': False, 'mensaje': 'No tienes permiso para realizar esta acción'}), 403
    
    resultado = data_manager.eliminar_umbral_configuracion(umbral_id)
    
    if resultado:
        return jsonify({'success': True, 'mensaje': 'Umbral eliminado exitosamente'})
    else:
        return jsonify({'success': False, 'mensaje': 'Error al eliminar el umbral'})

# Rutas para usuarios
@app.route('/api/usuarios', methods=['GET'])
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

@app.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
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


# Iniciar servidor
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)