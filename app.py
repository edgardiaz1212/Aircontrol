
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import pandas as pd
import os
import json
import io

from data_manager import DataManager
from database import init_db, Usuario
from utils import (
    crear_grafico_temperatura_humedad,
    crear_grafico_comparativo
)

# Inicializar la aplicación Flask
app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clave_secreta_para_desarrollo')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)

# Inicializar Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Inicializar la base de datos
init_db()

# Inicializar el gestor de datos
data_manager = DataManager()
# Crear usuario administrador por defecto si no existe ninguno
data_manager.crear_admin_por_defecto()

# Clase de usuario para Flask-Login
class User(UserMixin):
    def __init__(self, id, username, nombre, apellido, email, rol):
        self.id = id
        self.username = username
        self.nombre = nombre
        self.apellido = apellido
        self.email = email
        self.rol = rol
    
    def is_admin(self):
        return self.rol == 'admin'
    
    def is_supervisor(self):
        return self.rol == 'supervisor'
    
    def is_operador(self):
        return self.rol == 'operador'

@login_manager.user_loader
def load_user(user_id):
    usuario = data_manager.obtener_usuario_por_id(int(user_id))
    if usuario:
        return User(
            id=usuario.id,
            username=usuario.username,
            nombre=usuario.nombre,
            apellido=usuario.apellido,
            email=usuario.email,
            rol=usuario.rol
        )
    return None

# Ruta para la página de inicio
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

# Rutas para autenticación
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        usuario = data_manager.verificar_credenciales(username, password)
        
        if usuario:
            user = User(
                id=usuario.id,
                username=usuario.username,
                nombre=usuario.nombre,
                apellido=usuario.apellido,
                email=usuario.email,
                rol=usuario.rol
            )
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            error = 'Credenciales inválidas. Por favor, intenta de nuevo.'
    
    return render_template('login.html', error=error)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated and not current_user.is_admin():
        return redirect(url_for('dashboard'))
    
    error = None
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        apellido = request.form.get('apellido')
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        # Validaciones
        if not (nombre and apellido and email and username and password and password_confirm):
            error = 'Por favor, completa todos los campos.'
        elif password != password_confirm:
            error = 'Las contraseñas no coinciden.'
        else:
            # Asignar rol
            rol = request.form.get('rol', 'operador')
            if current_user.is_authenticated and current_user.is_admin():
                # Admins pueden crear cualquier tipo de usuario
                if rol not in ['admin', 'supervisor', 'operador']:
                    rol = 'operador'
            else:
                # Registro público solo permite operadores
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
                flash('Usuario registrado exitosamente! Ya puedes iniciar sesión.')
                return redirect(url_for('login'))
            else:
                error = 'No se pudo crear el usuario. El email o nombre de usuario ya están en uso.'
    
    return render_template('register.html', error=error)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# Ruta para el panel principal
@app.route('/dashboard')
@login_required
def dashboard():
    aires_df = pd.DataFrame(data_manager.obtener_aires())
    
    if aires_df.empty:
        aires_count = 0
        lecturas_count = 0
        temp_promedio = 0
        hum_promedio = 0
    else:
        aires_count = len(aires_df)
        stats = data_manager.obtener_estadisticas_generales()
        lecturas_count = stats['total_lecturas']
        temp_promedio = stats['temperatura']['promedio']
        hum_promedio = stats['humedad']['promedio']
    
    return render_template(
        'dashboard.html', 
        aires_count=aires_count,
        lecturas_count=lecturas_count,
        temp_promedio=temp_promedio,
        hum_promedio=hum_promedio
    )

# API para obtener datos para gráficos
@app.route('/api/aires', methods=['GET'])
@login_required
def get_aires():
    aires_df = data_manager.obtener_aires()
    if aires_df.empty:
        return jsonify([])
    
    aires_list = []
    for _, row in aires_df.iterrows():
        aires_list.append({
            'id': int(row['id']),
            'nombre': row['nombre'],
            'ubicacion': row['ubicacion'],
            'fecha_instalacion': row['fecha_instalacion']
        })
    
    return jsonify(aires_list)

@app.route('/api/lecturas', methods=['GET'])
@login_required
def get_lecturas():
    aire_id = request.args.get('aire_id', type=int)
    lecturas_df = data_manager.obtener_lecturas_por_aire(aire_id) if aire_id else data_manager.obtener_lecturas()
    
    if lecturas_df.empty:
        return jsonify([])
    
    lecturas_list = []
    for _, row in lecturas_df.iterrows():
        lecturas_list.append({
            'id': int(row['id']),
            'aire_id': int(row['aire_id']),
            'fecha': row['fecha'].strftime('%Y-%m-%d %H:%M:%S'),
            'temperatura': float(row['temperatura']),
            'humedad': float(row['humedad'])
        })
    
    return jsonify(lecturas_list)

# Ruta para el registro de lecturas
@app.route('/lecturas', methods=['GET', 'POST'])
@login_required
def lecturas():
    if request.method == 'POST':
        aire_id = request.form.get('aire_id', type=int)
        fecha_str = request.form.get('fecha')
        hora_str = request.form.get('hora')
        temperatura = request.form.get('temperatura', type=float)
        humedad = request.form.get('humedad', type=float)
        
        if aire_id and fecha_str and hora_str and temperatura is not None and humedad is not None:
            fecha_hora_str = f"{fecha_str} {hora_str}"
            fecha_dt = pd.to_datetime(fecha_hora_str)
            
            lectura_id = data_manager.agregar_lectura(
                aire_id,
                fecha_dt,
                temperatura,
                humedad
            )
            
            if lectura_id:
                flash('Lectura registrada exitosamente', 'success')
            else:
                flash('Error al registrar la lectura', 'error')
    
    aires_df = data_manager.obtener_aires()
    
    return render_template('lecturas.html', aires=aires_df)

@app.route('/api/lecturas/<int:lectura_id>', methods=['DELETE'])
@login_required
def eliminar_lectura(lectura_id):
    if current_user.is_operador() and not (current_user.is_admin() or current_user.is_supervisor()):
        return jsonify({'success': False, 'error': 'No tienes permisos para eliminar lecturas'}), 403
    
    resultado = data_manager.eliminar_lectura(lectura_id)
    return jsonify({'success': resultado})

# Ruta para la gestión de aires acondicionados
@app.route('/aires', methods=['GET', 'POST'])
@login_required
def aires():
    if current_user.is_operador() and not (current_user.is_admin() or current_user.is_supervisor()):
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add':
            nombre = request.form.get('nombre')
            ubicacion = request.form.get('ubicacion')
            fecha_instalacion = request.form.get('fecha_instalacion')
            
            if nombre and ubicacion and fecha_instalacion:
                aire_id = data_manager.agregar_aire(nombre, ubicacion, fecha_instalacion)
                if aire_id:
                    flash('Aire acondicionado agregado exitosamente', 'success')
                else:
                    flash('Error al agregar el aire acondicionado', 'error')
        
        elif action == 'edit':
            aire_id = request.form.get('aire_id', type=int)
            nombre = request.form.get('nombre')
            ubicacion = request.form.get('ubicacion')
            fecha_instalacion = request.form.get('fecha_instalacion')
            
            if aire_id and nombre and ubicacion and fecha_instalacion:
                actualizado = data_manager.actualizar_aire(aire_id, nombre, ubicacion, fecha_instalacion)
                if actualizado:
                    flash('Aire acondicionado actualizado exitosamente', 'success')
                else:
                    flash('Error al actualizar el aire acondicionado', 'error')
        
        elif action == 'delete':
            aire_id = request.form.get('aire_id', type=int)
            
            if aire_id:
                data_manager.eliminar_aire(aire_id)
                flash('Aire acondicionado eliminado exitosamente', 'success')
    
    aires_df = data_manager.obtener_aires()
    
    return render_template('aires.html', aires=aires_df)

# Ruta para gestión de usuarios (solo admin)
@app.route('/usuarios', methods=['GET', 'POST'])
@login_required
def usuarios():
    if not current_user.is_admin():
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'edit':
            usuario_id = request.form.get('usuario_id', type=int)
            nombre = request.form.get('nombre')
            apellido = request.form.get('apellido')
            email = request.form.get('email')
            rol = request.form.get('rol')
            activo = request.form.get('activo') == 'on'
            
            if usuario_id and nombre and apellido and email and rol:
                actualizado = data_manager.actualizar_usuario(
                    usuario_id=usuario_id,
                    nombre=nombre,
                    apellido=apellido,
                    email=email,
                    rol=rol,
                    activo=activo
                )
                
                if actualizado:
                    flash('Usuario actualizado exitosamente', 'success')
                else:
                    flash('Error al actualizar el usuario', 'error')
    
    usuarios_df = data_manager.obtener_usuarios(solo_activos=False)
    
    return render_template('usuarios.html', usuarios=usuarios_df)

# Ruta para análisis y estadísticas
@app.route('/estadisticas')
@login_required
def estadisticas():
    return render_template('estadisticas.html')

@app.route('/api/estadisticas/aire/<int:aire_id>')
@login_required
def estadisticas_aire(aire_id):
    stats = data_manager.obtener_estadisticas_por_aire(aire_id)
    return jsonify(stats)

@app.route('/api/estadisticas/general')
@login_required
def estadisticas_general():
    stats = data_manager.obtener_estadisticas_generales()
    return jsonify(stats)

@app.route('/api/estadisticas/ubicacion', methods=['GET'])
@login_required
def estadisticas_ubicacion():
    ubicacion = request.args.get('ubicacion')
    stats_df = data_manager.obtener_estadisticas_por_ubicacion(ubicacion)
    
    if stats_df.empty:
        return jsonify([])
    
    stats_list = []
    for _, row in stats_df.iterrows():
        stats_dict = {}
        for column in stats_df.columns:
            stats_dict[column] = row[column]
        stats_list.append(stats_dict)
    
    return jsonify(stats_list)

# Ruta para umbrales de configuración
@app.route('/umbrales', methods=['GET', 'POST'])
@login_required
def umbrales():
    if current_user.is_operador() and not (current_user.is_admin() or current_user.is_supervisor()):
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add':
            nombre = request.form.get('nombre')
            es_global = request.form.get('tipo') == 'global'
            aire_id = request.form.get('aire_id', type=int) if not es_global else None
            temp_min = request.form.get('temp_min', type=float)
            temp_max = request.form.get('temp_max', type=float)
            hum_min = request.form.get('hum_min', type=float)
            hum_max = request.form.get('hum_max', type=float)
            notificar_activo = request.form.get('notificar') == 'on'
            
            if nombre and temp_min is not None and temp_max is not None and hum_min is not None and hum_max is not None:
                if temp_min < temp_max and hum_min < hum_max:
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
                        flash('Umbral configurado exitosamente', 'success')
                    else:
                        flash('Error al configurar el umbral', 'error')
                else:
                    flash('Los valores mínimos deben ser menores que los máximos', 'error')
        
        elif action == 'edit':
            umbral_id = request.form.get('umbral_id', type=int)
            nombre = request.form.get('nombre')
            temp_min = request.form.get('temp_min', type=float)
            temp_max = request.form.get('temp_max', type=float)
            hum_min = request.form.get('hum_min', type=float)
            hum_max = request.form.get('hum_max', type=float)
            notificar_activo = request.form.get('notificar') == 'on'
            
            if umbral_id and nombre and temp_min is not None and temp_max is not None and hum_min is not None and hum_max is not None:
                if temp_min < temp_max and hum_min < hum_max:
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
                        flash('Umbral actualizado exitosamente', 'success')
                    else:
                        flash('Error al actualizar el umbral', 'error')
                else:
                    flash('Los valores mínimos deben ser menores que los máximos', 'error')
        
        elif action == 'delete':
            umbral_id = request.form.get('umbral_id', type=int)
            
            if umbral_id:
                eliminado = data_manager.eliminar_umbral_configuracion(umbral_id)
                if eliminado:
                    flash('Umbral eliminado exitosamente', 'success')
                else:
                    flash('Error al eliminar el umbral', 'error')
    
    aires_df = data_manager.obtener_aires()
    umbrales_df = data_manager.obtener_umbrales_configuracion()
    
    return render_template('umbrales.html', aires=aires_df, umbrales=umbrales_df)

# Ruta para mantenimientos
@app.route('/mantenimientos', methods=['GET', 'POST'])
@login_required
def mantenimientos():
    if current_user.is_operador() and not (current_user.is_admin() or current_user.is_supervisor()):
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add':
            aire_id = request.form.get('aire_id', type=int)
            tipo_mantenimiento = request.form.get('tipo_mantenimiento')
            descripcion = request.form.get('descripcion')
            tecnico = request.form.get('tecnico')
            imagen_file = request.files.get('imagen_file')
            
            if aire_id and tipo_mantenimiento and descripcion and tecnico:
                imagen_data = None
                if imagen_file and imagen_file.filename:
                    imagen_data = imagen_file
                
                mantenimiento_id = data_manager.agregar_mantenimiento(
                    aire_id=aire_id,
                    tipo_mantenimiento=tipo_mantenimiento,
                    descripcion=descripcion,
                    tecnico=tecnico,
                    imagen_file=imagen_data
                )
                
                if mantenimiento_id:
                    flash('Mantenimiento registrado exitosamente', 'success')
                else:
                    flash('Error al registrar el mantenimiento', 'error')
        
        elif action == 'delete':
            mantenimiento_id = request.form.get('mantenimiento_id', type=int)
            
            if mantenimiento_id:
                eliminado = data_manager.eliminar_mantenimiento(mantenimiento_id)
                if eliminado:
                    flash('Mantenimiento eliminado exitosamente', 'success')
                else:
                    flash('Error al eliminar el mantenimiento', 'error')
    
    aires_df = data_manager.obtener_aires()
    mantenimientos_df = data_manager.obtener_mantenimientos()
    
    return render_template('mantenimientos.html', aires=aires_df, mantenimientos=mantenimientos_df)

# Ruta para exportar datos
@app.route('/exportar', methods=['GET', 'POST'])
@login_required
def exportar():
    if current_user.is_operador() and not (current_user.is_admin() or current_user.is_supervisor()):
        flash('No tienes permiso para acceder a esta página', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        formato = request.form.get('formato', 'csv')
        
        if formato in ['csv', 'excel']:
            resultado = data_manager.exportar_datos(formato=formato)
            
            if resultado:
                if formato == 'csv':
                    aires_export, lecturas_export, mantenimientos_export = resultado
                    flash(f'Datos exportados exitosamente a {aires_export}, {lecturas_export} y {mantenimientos_export}', 'success')
                else:
                    export_file = resultado
                    flash(f'Datos exportados exitosamente a {export_file}', 'success')
            else:
                flash('Error al exportar los datos', 'error')
    
    # Obtener datos para vista previa
    aires_df = data_manager.obtener_aires()
    lecturas_df = data_manager.obtener_lecturas()
    
    return render_template(
        'exportar.html', 
        aires_count=len(aires_df) if not aires_df.empty else 0,
        lecturas_count=len(lecturas_df) if not lecturas_df.empty else 0
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
