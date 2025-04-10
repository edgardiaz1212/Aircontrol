import pandas as pd
import os
import numpy as np
import io
from datetime import datetime
from database import session, AireAcondicionado, Lectura, Mantenimiento, UmbralConfiguracion, Usuario, init_db
from cryptography.fernet import Fernet
import hashlib
from sqlalchemy import func, distinct, desc
from sqlalchemy.orm import aliased
import traceback
import sys

class DataManager:
    def __init__(self):
        self.data_dir = "data"
        self.aires_file = os.path.join(self.data_dir, "aires_acondicionados.csv")
        self.lecturas_file = os.path.join(self.data_dir, "lecturas.csv")
        
        # Asegurar que el directorio de datos exista
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        # Inicializar la base de datos
        init_db()
        
        # Migrar datos de CSV a base de datos si es necesario
        self.migrar_datos_si_necesario()
    
    def migrar_datos_si_necesario(self):
        # Verificar si hay datos en la base de datos
        aires_count = session.query(AireAcondicionado).count()
        
        # Solo migrar si no hay datos en la BD y existen los archivos CSV
        if aires_count == 0:
            # Migrar aires acondicionados
            if os.path.exists(self.aires_file):
                aires_df = pd.read_csv(self.aires_file)
                for _, row in aires_df.iterrows():
                    aire = AireAcondicionado(
                        id=int(row['id']),
                        nombre=row['nombre'],
                        ubicacion=row['ubicacion'],
                        fecha_instalacion=row['fecha_instalacion']
                    )
                    session.add(aire)
                session.commit()
            else:
                # Crear aires predeterminados
                for i in range(1, 8):
                    aire = AireAcondicionado(
                        nombre=f'Aire {i}',
                        ubicacion='Ubicación por definir',
                        fecha_instalacion=datetime.now().strftime('%Y-%m-%d')
                    )
                    session.add(aire)
                session.commit()
            
            # Migrar lecturas si existen
            if os.path.exists(self.lecturas_file):
                lecturas_df = pd.read_csv(self.lecturas_file)
                if not lecturas_df.empty:
                    # Convertir fecha a datetime si es string
                    if lecturas_df['fecha'].dtype == 'object':
                        lecturas_df['fecha'] = pd.to_datetime(lecturas_df['fecha'])
                    
                    for _, row in lecturas_df.iterrows():
                        lectura = Lectura(
                            id=int(row['id']),
                            aire_id=int(row['aire_id']),
                            fecha=row['fecha'],
                            temperatura=float(row['temperatura']),
                            humedad=float(row['humedad'])
                        )
                        session.add(lectura)
                    session.commit()
    
    def obtener_aires(self):
        # Consultar todos los aires de la base de datos
        aires = session.query(AireAcondicionado).all()
        
        # Convertir a DataFrame
        aires_data = [
            {
                'id': aire.id,
                'nombre': aire.nombre,
                'ubicacion': aire.ubicacion,
                'fecha_instalacion': aire.fecha_instalacion
            }
            for aire in aires
        ]
        
        return pd.DataFrame(aires_data)
    
    def obtener_lecturas(self):
        # Consultar todas las lecturas de la base de datos
        lecturas = session.query(Lectura).all()
        
        # Convertir a DataFrame
        lecturas_data = [
            {
                'id': lectura.id,
                'aire_id': lectura.aire_id,
                'fecha': lectura.fecha,
                'temperatura': lectura.temperatura,
                'humedad': lectura.humedad
            }
            for lectura in lecturas
        ]
        
        return pd.DataFrame(lecturas_data)
    
    def agregar_aire(self, nombre, ubicacion, fecha_instalacion):
        # Crear nuevo aire acondicionado en la base de datos
        nuevo_aire = AireAcondicionado(
            nombre=nombre,
            ubicacion=ubicacion,
            fecha_instalacion=fecha_instalacion
        )
        
        session.add(nuevo_aire)
        session.commit()
        
        return nuevo_aire.id
        
    def actualizar_aire(self, aire_id, nombre, ubicacion, fecha_instalacion):
        """
        Actualiza la información de un aire acondicionado.
        
        Args:
            aire_id: ID del aire acondicionado a actualizar
            nombre: Nuevo nombre
            ubicacion: Nueva ubicación
            fecha_instalacion: Nueva fecha de instalación
            
        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        aire = session.query(AireAcondicionado).filter(AireAcondicionado.id == aire_id).first()
        
        if aire:
            aire.nombre = nombre
            aire.ubicacion = ubicacion
            aire.fecha_instalacion = fecha_instalacion
            
            session.commit()
            return True
        
        return False
    
    def agregar_lectura(self, aire_id, fecha, temperatura, humedad):
        # Crear nueva lectura en la base de datos
        nueva_lectura = Lectura(
            aire_id=aire_id,
            fecha=fecha,
            temperatura=temperatura,
            humedad=humedad
        )
        
        session.add(nueva_lectura)
        session.commit()
        
        return nueva_lectura.id
    
    def obtener_lecturas_por_aire(self, aire_id):
        # Consultar lecturas de un aire específico
        lecturas = session.query(Lectura).filter(Lectura.aire_id == aire_id).all()
        
        # Convertir a DataFrame
        lecturas_data = [
            {
                'id': lectura.id,
                'aire_id': lectura.aire_id,
                'fecha': lectura.fecha,
                'temperatura': lectura.temperatura,
                'humedad': lectura.humedad
            }
            for lectura in lecturas
        ]
        
        return pd.DataFrame(lecturas_data)
        
    def eliminar_lectura(self, lectura_id):
        """
        Elimina una lectura por su ID.
        
        Args:
            lectura_id: ID de la lectura a eliminar
            
        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        lectura = session.query(Lectura).filter(Lectura.id == lectura_id).first()
        
        if lectura:
            session.delete(lectura)
            session.commit()
            return True
        
        return False
    
    def obtener_estadisticas_por_aire(self, aire_id):
        # Consultar estadísticas de un aire específico desde la base de datos
        result = session.query(
            func.avg(Lectura.temperatura).label('temp_avg'),
            func.min(Lectura.temperatura).label('temp_min'),
            func.max(Lectura.temperatura).label('temp_max'),
            func.stddev(Lectura.temperatura).label('temp_std'),
            func.avg(Lectura.humedad).label('hum_avg'),
            func.min(Lectura.humedad).label('hum_min'),
            func.max(Lectura.humedad).label('hum_max'),
            func.stddev(Lectura.humedad).label('hum_std')
        ).filter(Lectura.aire_id == aire_id).first()
        
        # Si no hay lecturas, devolver valores predeterminados
        if result.temp_avg is None:
            return {
                'temperatura': {
                    'promedio': 0,
                    'minimo': 0,
                    'maximo': 0,
                    'desviacion': 0
                },
                'humedad': {
                    'promedio': 0,
                    'minimo': 0,
                    'maximo': 0,
                    'desviacion': 0
                }
            }
        
        # Convertir a diccionario
        return {
            'temperatura': {
                'promedio': round(result.temp_avg, 2) if result.temp_avg else 0,
                'minimo': round(result.temp_min, 2) if result.temp_min else 0,
                'maximo': round(result.temp_max, 2) if result.temp_max else 0,
                'desviacion': round(result.temp_std, 2) if result.temp_std else 0
            },
            'humedad': {
                'promedio': round(result.hum_avg, 2) if result.hum_avg else 0,
                'minimo': round(result.hum_min, 2) if result.hum_min else 0,
                'maximo': round(result.hum_max, 2) if result.hum_max else 0,
                'desviacion': round(result.hum_std, 2) if result.hum_std else 0
            }
        }
    
    def obtener_estadisticas_generales(self):
        # Consultar estadísticas generales desde la base de datos
        result = session.query(
            func.avg(Lectura.temperatura).label('temp_avg'),
            func.min(Lectura.temperatura).label('temp_min'),
            func.max(Lectura.temperatura).label('temp_max'),
            func.avg(Lectura.humedad).label('hum_avg'),
            func.min(Lectura.humedad).label('hum_min'),
            func.max(Lectura.humedad).label('hum_max'),
            func.count(distinct(Lectura.id)).label('total_lecturas')
        ).first()
        
        # Si no hay lecturas, devolver valores predeterminados
        if result.temp_avg is None:
            return {
                'temperatura': {
                    'promedio': 0,
                    'minimo': 0,
                    'maximo': 0
                },
                'humedad': {
                    'promedio': 0,
                    'minimo': 0,
                    'maximo': 0
                },
                'total_lecturas': 0
            }
        
        # Convertir a diccionario
        return {
            'temperatura': {
                'promedio': round(result.temp_avg, 2) if result.temp_avg else 0,
                'minimo': round(result.temp_min, 2) if result.temp_min else 0,
                'maximo': round(result.temp_max, 2) if result.temp_max else 0
            },
            'humedad': {
                'promedio': round(result.hum_avg, 2) if result.hum_avg else 0,
                'minimo': round(result.hum_min, 2) if result.hum_min else 0,
                'maximo': round(result.hum_max, 2) if result.hum_max else 0
            },
            'total_lecturas': result.total_lecturas or 0
        }
        
    def obtener_ubicaciones(self):
        """
        Obtiene todas las ubicaciones únicas de los aires acondicionados.
        
        Returns:
            Lista de ubicaciones únicas
        """
        ubicaciones = session.query(distinct(AireAcondicionado.ubicacion)).all()
        return [ubicacion[0] for ubicacion in ubicaciones]
    
    def obtener_aires_por_ubicacion(self, ubicacion):
        """
        Obtiene los aires acondicionados en una ubicación específica.
        
        Args:
            ubicacion: La ubicación a filtrar
            
        Returns:
            DataFrame con los aires en esa ubicación
        """
        aires = session.query(AireAcondicionado).filter(AireAcondicionado.ubicacion == ubicacion).all()
        
        # Convertir a DataFrame
        aires_data = [
            {
                'id': aire.id,
                'nombre': aire.nombre,
                'ubicacion': aire.ubicacion,
                'fecha_instalacion': aire.fecha_instalacion
            }
            for aire in aires
        ]
        
        return pd.DataFrame(aires_data)
    
    def obtener_estadisticas_por_ubicacion(self, ubicacion=None):
        """
        Obtiene estadísticas agrupadas por ubicación.
        
        Args:
            ubicacion: Opcional, filtrar por una ubicación específica
            
        Returns:
            DataFrame con estadísticas por ubicación
        """
        # Si no hay lecturas o aires, devolver DataFrame vacío
        aires_count = session.query(AireAcondicionado).count()
        if aires_count == 0:
            return pd.DataFrame()
        
        # Obtener todas las ubicaciones o la ubicación específica
        if ubicacion:
            ubicaciones = [ubicacion]
        else:
            ubicaciones = self.obtener_ubicaciones()
        
        # Lista para almacenar resultados
        resultados = []
        
        # Para cada ubicación, obtener sus aires y estadísticas
        for ubicacion_actual in ubicaciones:
            # Obtener IDs de aires en esta ubicación
            aires_ids = session.query(AireAcondicionado.id).filter(
                AireAcondicionado.ubicacion == ubicacion_actual
            ).all()
            aires_ids = [aire_id[0] for aire_id in aires_ids]
            
            if not aires_ids:
                continue
            
            # Consultar estadísticas para estos aires
            result = session.query(
                func.avg(Lectura.temperatura).label('temp_avg'),
                func.min(Lectura.temperatura).label('temp_min'),
                func.max(Lectura.temperatura).label('temp_max'),
                func.stddev(Lectura.temperatura).label('temp_std'),
                func.avg(Lectura.humedad).label('hum_avg'),
                func.min(Lectura.humedad).label('hum_min'),
                func.max(Lectura.humedad).label('hum_max'),
                func.stddev(Lectura.humedad).label('hum_std'),
                func.count(distinct(Lectura.id)).label('total_lecturas')
            ).filter(Lectura.aire_id.in_(aires_ids)).first()
            
            # Si hay lecturas para esta ubicación
            if result.temp_avg is not None:
                resultados.append({
                    'ubicacion': ubicacion_actual,
                    'num_aires': len(aires_ids),
                    'temperatura_promedio': round(result.temp_avg, 2) if result.temp_avg else 0,
                    'temperatura_min': round(result.temp_min, 2) if result.temp_min else 0,
                    'temperatura_max': round(result.temp_max, 2) if result.temp_max else 0,
                    'temperatura_std': round(result.temp_std, 2) if result.temp_std else 0,
                    'humedad_promedio': round(result.hum_avg, 2) if result.hum_avg else 0,
                    'humedad_min': round(result.hum_min, 2) if result.hum_min else 0,
                    'humedad_max': round(result.hum_max, 2) if result.hum_max else 0,
                    'humedad_std': round(result.hum_std, 2) if result.hum_std else 0,
                    'lecturas_totales': result.total_lecturas or 0
                })
        
        # Convertir resultados a DataFrame
        return pd.DataFrame(resultados)
    
    def eliminar_aire(self, aire_id):
        # Obtener el aire a eliminar
        aire = session.query(AireAcondicionado).filter(AireAcondicionado.id == aire_id).first()
        
        if aire:
            # SQLAlchemy eliminará automáticamente las lecturas asociadas debido a la relación cascade
            session.delete(aire)
            session.commit()
    
    def agregar_mantenimiento(self, aire_id, tipo_mantenimiento, descripcion, tecnico, imagen_file=None):
        """
        Agrega un nuevo registro de mantenimiento a la base de datos. Maneja errores.

        Args:
            aire_id: ID del aire acondicionado
            tipo_mantenimiento: Tipo de mantenimiento realizado
            descripcion: Descripción detallada del mantenimiento
            tecnico: Nombre del técnico que realizó el mantenimiento
            imagen_file: Objeto FileStorage de Flask (opcional)

        Returns:
            ID del nuevo mantenimiento registrado o None si ocurre un error.
        """
        print(f"Intentando agregar mantenimiento para aire_id: {aire_id}")
        print(f"Archivo recibido: {imagen_file}")

        nuevo_mantenimiento = Mantenimiento(
            aire_id=aire_id,
            fecha=datetime.now(),
            tipo_mantenimiento=tipo_mantenimiento,
            descripcion=descripcion,
            tecnico=tecnico
        )

        try:
            # Si se cargó una imagen, procesarla y guardarla
            if imagen_file and imagen_file.filename: # Verificar que hay archivo y tiene nombre
                print(f"Procesando imagen: {imagen_file.filename}, tipo: {imagen_file.content_type}")

                # Obtener bytes de la imagen
                imagen_bytes = imagen_file.read()
                print(f"Leídos {len(imagen_bytes)} bytes de la imagen.")

                # Guardar datos de la imagen (usando los atributos correctos)
                nuevo_mantenimiento.imagen_nombre = imagen_file.filename
                nuevo_mantenimiento.imagen_tipo = imagen_file.content_type
                nuevo_mantenimiento.imagen_datos = imagen_bytes # Asegúrate que la columna en BD sea BLOB/BYTEA

            # Guardar en la base de datos
            print("Añadiendo mantenimiento a la sesión...")
            session.add(nuevo_mantenimiento)
            print("Intentando hacer commit...")
            session.commit()
            print(f"Mantenimiento guardado con ID: {nuevo_mantenimiento.id}")

            return nuevo_mantenimiento.id

        except Exception as e:
            # Si algo falla (lectura de archivo, commit a BD), hacer rollback
            print(f"!!! ERROR en agregar_mantenimiento: {e}", file=sys.stderr)
            traceback.print_exc() # Imprime el traceback completo en la consola del servidor
            session.rollback() # Deshacer cambios en la sesión actual
            return None # Indicar que hubo un error
    
    def obtener_mantenimientos(self, aire_id=None):
        """
        Obtiene todos los mantenimientos, opcionalmente filtrados por aire_id.
        
        Args:
            aire_id: Opcional, ID del aire acondicionado para filtrar
            
        Returns:
            DataFrame con los mantenimientos
        """
        # Construir la consulta
        query = session.query(Mantenimiento)
        
        # Filtrar por aire_id si se proporciona
        if aire_id is not None:
            query = query.filter(Mantenimiento.aire_id == aire_id)
        
        # Ordenar por fecha (más recientes primero)
        mantenimientos = query.order_by(Mantenimiento.fecha.desc()).all()
        
        # Convertir a DataFrame
        mantenimientos_data = [
            {
                'id': mant.id,
                'aire_id': mant.aire_id,
                'fecha': mant.fecha,
                'tipo_mantenimiento': mant.tipo_mantenimiento,
                'descripcion': mant.descripcion,
                'tecnico': mant.tecnico,
                'tiene_imagen': mant.imagen_datos is not None
            }
            for mant in mantenimientos
        ]
        
        return pd.DataFrame(mantenimientos_data)
    
    def obtener_mantenimiento_por_id(self, mantenimiento_id):
        """
        Obtiene un mantenimiento específico por su ID.
        
        Args:
            mantenimiento_id: ID del mantenimiento a obtener
            
        Returns:
            Objeto Mantenimiento o None si no existe
        """
        return session.query(Mantenimiento).filter(Mantenimiento.id == mantenimiento_id).first()
    
    def eliminar_mantenimiento(self, mantenimiento_id):
        """
        Elimina un mantenimiento por su ID.
        
        Args:
            mantenimiento_id: ID del mantenimiento a eliminar
            
        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        mantenimiento = session.query(Mantenimiento).filter(Mantenimiento.id == mantenimiento_id).first()
        
        if mantenimiento:
            session.delete(mantenimiento)
            session.commit()
            return True
        
        return False
    
    def crear_umbral_configuracion(self, nombre, es_global, temp_min, temp_max, hum_min, hum_max, aire_id=None, notificar_activo=True):
        """
        Crea una nueva configuración de umbrales para temperatura y humedad.
        
        Args:
            nombre: Nombre descriptivo para esta configuración
            es_global: Si es True, aplica a todos los aires. Si es False, aplica solo al aire_id especificado
            temp_min: Temperatura mínima aceptable
            temp_max: Temperatura máxima aceptable
            hum_min: Humedad mínima aceptable
            hum_max: Humedad máxima aceptable
            aire_id: ID del aire acondicionado (solo si es_global=False)
            notificar_activo: Si las notificaciones están activas para estos umbrales
            
        Returns:
            ID de la configuración creada
        """
        # Verificar validez de los umbrales
        if temp_min >= temp_max or hum_min >= hum_max:
            return None
            
        # Si no es global, debe tener un aire_id
        if not es_global and aire_id is None:
            return None
            
        # Si es global, el aire_id debe ser None
        if es_global:
            aire_id = None
            
        # Crear nuevo umbral
        nuevo_umbral = UmbralConfiguracion(
            nombre=nombre,
            es_global=es_global,
            aire_id=aire_id,
            temp_min=temp_min,
            temp_max=temp_max,
            hum_min=hum_min,
            hum_max=hum_max,
            notificar_activo=notificar_activo
        )
        
        session.add(nuevo_umbral)
        session.commit()
        
        return nuevo_umbral.id
        
    def obtener_umbrales_configuracion(self, aire_id=None, solo_globales=False):
        """
        Obtiene todas las configuraciones de umbrales, opcionalmente filtradas por aire_id.
        
        Args:
            aire_id: ID del aire acondicionado para filtrar, o None para todos
            solo_globales: Si es True, devuelve solo las configuraciones globales
            
        Returns:
            DataFrame con las configuraciones de umbrales
        """
        # Construir la consulta
        query = session.query(UmbralConfiguracion)
        
        # Filtrar según los parámetros
        if solo_globales:
            query = query.filter(UmbralConfiguracion.es_global == True)
        elif aire_id is not None:
            query = query.filter(
                (UmbralConfiguracion.aire_id == aire_id) | 
                (UmbralConfiguracion.es_global == True)
            )
        
        # Ejecutar la consulta
        umbrales = query.all()
        
        # Convertir a DataFrame
        umbrales_data = [
            {
                'id': u.id,
                'nombre': u.nombre,
                'es_global': u.es_global,
                'aire_id': u.aire_id,
                'temp_min': u.temp_min,
                'temp_max': u.temp_max,
                'hum_min': u.hum_min,
                'hum_max': u.hum_max,
                'notificar_activo': u.notificar_activo,
                'fecha_creacion': u.fecha_creacion,
                'ultima_modificacion': u.ultima_modificacion
            }
            for u in umbrales
        ]
        
        # Añadir información del nombre del aire si hay aire_id
        umbral_df = pd.DataFrame(umbrales_data)
        
        if not umbral_df.empty and 'aire_id' in umbral_df.columns:
            # Filtrar umbrales que tienen aire_id (no son globales)
            umbrales_con_aire = umbral_df[umbral_df['aire_id'].notnull()]
            
            if not umbrales_con_aire.empty:
                # Obtener todos los aires
                aires_df = self.obtener_aires()
                
                # Mezclar para obtener los nombres
                umbral_df = pd.merge(
                    umbral_df,
                    aires_df[['id', 'nombre']],
                    how='left',
                    left_on='aire_id',
                    right_on='id',
                    suffixes=('', '_aire')
                )
                
                # Renombrar la columna
                if 'nombre_aire' in umbral_df.columns:
                    umbral_df.rename(columns={'nombre_aire': 'aire_nombre'}, inplace=True)
        
        return umbral_df
    
    def obtener_umbral_por_id(self, umbral_id):
        """
        Obtiene una configuración de umbral específica por su ID.
        
        Args:
            umbral_id: ID del umbral a obtener
            
        Returns:
            Objeto UmbralConfiguracion o None si no existe
        """
        return session.query(UmbralConfiguracion).filter(UmbralConfiguracion.id == umbral_id).first()
    
    def actualizar_umbral_configuracion(self, umbral_id, nombre, temp_min, temp_max, hum_min, hum_max, notificar_activo=True):
        """
        Actualiza una configuración de umbral existente.
        
        Args:
            umbral_id: ID de la configuración a actualizar
            nombre: Nuevo nombre
            temp_min: Nueva temperatura mínima
            temp_max: Nueva temperatura máxima
            hum_min: Nueva humedad mínima
            hum_max: Nueva humedad máxima
            notificar_activo: Si las notificaciones están activas
            
        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        # Verificar validez de los umbrales
        if temp_min >= temp_max or hum_min >= hum_max:
            return False
            
        # Obtener la configuración
        umbral = self.obtener_umbral_por_id(umbral_id)
        
        if umbral:
            # Actualizar campos
            umbral.nombre = nombre
            umbral.temp_min = temp_min
            umbral.temp_max = temp_max
            umbral.hum_min = hum_min
            umbral.hum_max = hum_max
            umbral.notificar_activo = notificar_activo
            
            # No se puede cambiar es_global o aire_id una vez creado
            
            session.commit()
            return True
            
        return False
    
    def eliminar_umbral_configuracion(self, umbral_id):
        """
        Elimina una configuración de umbral por su ID.
        
        Args:
            umbral_id: ID de la configuración a eliminar
            
        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        # Validar parámetro de entrada
        if not isinstance(umbral_id, int) or umbral_id <= 0:
            print(f"Error: ID de umbral inválido: {umbral_id}", file=sys.stderr)
            return False
            
        try:
            # Obtener el umbral
            umbral = self.obtener_umbral_por_id(umbral_id)
            
            if not umbral:
                print(f"Umbral con ID {umbral_id} no encontrado", file=sys.stderr)
                return False
                
            # Eliminar el umbral
            session.delete(umbral)
            session.commit()
            print(f"Umbral con ID {umbral_id} eliminado correctamente")
            return True
            
        except Exception as e:
            print(f"Error al eliminar umbral {umbral_id}: {e}", file=sys.stderr)
            traceback.print_exc()
            session.rollback()
            return False
        
    def verificar_lectura_dentro_umbrales(self, aire_id, temperatura, humedad):
        """
        Verifica si una lectura está dentro de los umbrales configurados.
        
        Args:
            aire_id: ID del aire acondicionado
            temperatura: Temperatura a verificar
            humedad: Humedad a verificar
            
        Returns:
            Diccionario con el resultado de la verificación
        """
        # Obtener umbrales aplicables (específicos del aire + globales)
        umbrales_df = self.obtener_umbrales_configuracion(aire_id=aire_id)
        
        if umbrales_df.empty:
            # Si no hay umbrales configurados, considerar que está dentro de límites
            return {
                'dentro_limite': True,
                'alertas': []
            }
        
        # Lista para almacenar alertas
        alertas = []
        
        # Verificar cada umbral
        for _, umbral in umbrales_df.iterrows():
            if not umbral['notificar_activo']:
                continue
                
            # Verificar temperatura
            if temperatura < umbral['temp_min']:
                alertas.append({
                    'tipo': 'temperatura',
                    'umbral_id': umbral['id'],
                    'umbral_nombre': umbral['nombre'],
                    'valor': temperatura,
                    'limite': umbral['temp_min'],
                    'mensaje': f"Temperatura ({temperatura}°C) por debajo del mínimo ({umbral['temp_min']}°C)"
                })
            elif temperatura > umbral['temp_max']:
                alertas.append({
                    'tipo': 'temperatura',
                    'umbral_id': umbral['id'],
                    'umbral_nombre': umbral['nombre'],
                    'valor': temperatura,
                    'limite': umbral['temp_max'],
                    'mensaje': f"Temperatura ({temperatura}°C) por encima del máximo ({umbral['temp_max']}°C)"
                })
                
            # Verificar humedad
            if humedad < umbral['hum_min']:
                alertas.append({
                    'tipo': 'humedad',
                    'umbral_id': umbral['id'],
                    'umbral_nombre': umbral['nombre'],
                    'valor': humedad,
                    'limite': umbral['hum_min'],
                    'mensaje': f"Humedad ({humedad}%) por debajo del mínimo ({umbral['hum_min']}%)"
                })
            elif humedad > umbral['hum_max']:
                alertas.append({
                    'tipo': 'humedad',
                    'umbral_id': umbral['id'],
                    'umbral_nombre': umbral['nombre'],
                    'valor': humedad,
                    'limite': umbral['hum_max'],
                    'mensaje': f"Humedad ({humedad}%) por encima del máximo ({umbral['hum_max']}%)"
                })
        
        # Devolver resultado
        return {
            'dentro_limite': len(alertas) == 0,
            'alertas': alertas
        }
    
    def exportar_datos(self, formato='csv'):
        # Asegurar que el directorio exista
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        # Obtener datos de la base de datos
        aires_df = self.obtener_aires()
        lecturas_df = self.obtener_lecturas()
        mantenimientos_df = self.obtener_mantenimientos()
        
        # Eliminar columna de imagen binaria para exportación
        if not mantenimientos_df.empty:
            mantenimientos_export_df = mantenimientos_df.copy()
        else:
            mantenimientos_export_df = pd.DataFrame()
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if formato == 'csv':
            aires_export = os.path.join(self.data_dir, f'aires_export_{timestamp}.csv')
            lecturas_export = os.path.join(self.data_dir, f'lecturas_export_{timestamp}.csv')
            mantenimientos_export = os.path.join(self.data_dir, f'mantenimientos_export_{timestamp}.csv')
            
            aires_df.to_csv(aires_export, index=False)
            lecturas_df.to_csv(lecturas_export, index=False)
            
            if not mantenimientos_export_df.empty:
                mantenimientos_export_df.to_csv(mantenimientos_export, index=False)
            
            return aires_export, lecturas_export, mantenimientos_export
        
        elif formato == 'excel':
            export_file = os.path.join(self.data_dir, f'export_{timestamp}.xlsx')
            
            with pd.ExcelWriter(export_file) as writer:
                aires_df.to_excel(writer, sheet_name='Aires', index=False)
                lecturas_df.to_excel(writer, sheet_name='Lecturas', index=False)
                
                if not mantenimientos_export_df.empty:
                    mantenimientos_export_df.to_excel(writer, sheet_name='Mantenimientos', index=False)
            
            return export_file
        
        return None
        
    # Métodos para gestión de usuarios
    def _hash_password(self, password):
        """
        Crea un hash seguro de la contraseña.
        
        Args:
            password: Contraseña en texto plano
            
        Returns:
            Hash de la contraseña
        """
        # Crear un hash SHA-256 de la contraseña
        return hashlib.sha256(password.encode()).hexdigest()
    
    def crear_usuario(self, nombre, apellido, email, username, password, rol='operador'):
        """
        Crea un nuevo usuario en la base de datos.
        
        Args:
            nombre: Nombre del usuario
            apellido: Apellido del usuario
            email: Correo electrónico único
            username: Nombre de usuario único
            password: Contraseña (se almacenará como hash)
            rol: Rol del usuario (admin, supervisor, operador, etc.)
            
        Returns:
            ID del usuario creado o None si ya existe un usuario con ese email o username
        """
        # Verificar si ya existe un usuario con ese email o username
        usuario_existente = session.query(Usuario).filter(
            (Usuario.email == email) | (Usuario.username == username)
        ).first()
        
        if usuario_existente:
            return None
        
        # Hashear la contraseña
        password_hash = self._hash_password(password)
        
        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            nombre=nombre,
            apellido=apellido,
            email=email,
            username=username,
            password=password_hash,
            rol=rol,
            fecha_registro=datetime.now()
        )
        
        session.add(nuevo_usuario)
        try:
            session.commit()
            return nuevo_usuario.id
        except:
            session.rollback()
            return None
    
    def verificar_credenciales(self, username, password):
        """
        Verifica las credenciales de inicio de sesión.
        
        Args:
            username: Nombre de usuario o email
            password: Contraseña en texto plano
            
        Returns:
            Usuario si las credenciales son válidas, None en caso contrario
        """
        # Hashear la contraseña para comparar
        password_hash = self._hash_password(password)
        
        # Buscar usuario por username o email
        usuario = session.query(Usuario).filter(
            ((Usuario.username == username) | (Usuario.email == username)) &
            (Usuario.password == password_hash) &
            (Usuario.activo == True)
        ).first()
        
        if usuario:
            # Actualizar última conexión
            usuario.ultima_conexion = datetime.now()
            session.commit()
            
        return usuario
    
    def obtener_usuario_por_id(self, usuario_id):
        """
        Obtiene un usuario por su ID.
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            Objeto Usuario o None si no existe
        """
        return session.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    def obtener_usuarios(self, solo_activos=True):
        """
        Obtiene todos los usuarios.
        
        Args:
            solo_activos: Si True, devuelve solo usuarios activos
            
        Returns:
            DataFrame con los usuarios
        """
        # Construir la consulta
        query = session.query(Usuario)
        
        if solo_activos:
            query = query.filter(Usuario.activo == True)
        
        usuarios = query.all()
        
        # Convertir a DataFrame
        usuarios_data = [
            {
                'id': u.id,
                'nombre': u.nombre,
                'apellido': u.apellido,
                'email': u.email,
                'username': u.username,
                'rol': u.rol,
                'activo': u.activo,
                'fecha_registro': u.fecha_registro,
                'ultima_conexion': u.ultima_conexion
            }
            for u in usuarios
        ]
        
        return pd.DataFrame(usuarios_data)
    
    def actualizar_usuario(self, usuario_id, nombre=None, apellido=None, email=None, rol=None, activo=None):
        """
        Actualiza la información de un usuario.
        
        Args:
            usuario_id: ID del usuario a actualizar
            nombre: Nuevo nombre (opcional)
            apellido: Nuevo apellido (opcional)
            email: Nuevo email (opcional)
            rol: Nuevo rol (opcional)
            activo: Nuevo estado de activación (opcional)
            
        Returns:
            True si se actualizó correctamente, False en caso contrario
        """
        usuario = self.obtener_usuario_por_id(usuario_id)
        
        if not usuario:
            return False
        
        # Actualizar solo los campos proporcionados
        if nombre is not None:
            usuario.nombre = nombre
        
        if apellido is not None:
            usuario.apellido = apellido
        
        if email is not None:
            # Verificar que el email no esté en uso por otro usuario
            email_existente = session.query(Usuario).filter(
                (Usuario.email == email) & (Usuario.id != usuario_id)
            ).first()
            
            if email_existente:
                return False
                
            usuario.email = email
        
        if rol is not None:
            usuario.rol = rol
        
        if activo is not None:
            usuario.activo = activo
        
        try:
            session.commit()
            return True
        except:
            session.rollback()
            return False
    
    def cambiar_password(self, usuario_id, password_actual, password_nueva):
        """
        Cambia la contraseña de un usuario.
        
        Args:
            usuario_id: ID del usuario
            password_actual: Contraseña actual en texto plano
            password_nueva: Nueva contraseña en texto plano
            
        Returns:
            True si se cambió correctamente, False en caso contrario
        """
        usuario = self.obtener_usuario_por_id(usuario_id)
        
        if not usuario:
            return False
        
        # Verificar contraseña actual
        if usuario.password != self._hash_password(password_actual):
            return False
        
        # Actualizar contraseña
        usuario.password = self._hash_password(password_nueva)
        
        try:
            session.commit()
            return True
        except:
            session.rollback()
            return False
            
    def crear_admin_por_defecto(self):
        """
        Crea un usuario administrador por defecto si no existe ningún usuario en el sistema.
        
        Returns:
            True si se creó el admin, False si ya existían usuarios
        """
        # Verificar si ya existen usuarios
        usuarios_count = session.query(Usuario).count()
        
        if usuarios_count > 0:
            return False
        
        # Crear admin por defecto
        self.crear_usuario(
            nombre="Administrador",
            apellido="Sistema",
            email="admin@sistema.com",
            username="admin",
            password="admin123",
            rol="admin"
        )
        
        return True
    
    def contar_aires(self):
        """
        Cuenta el número total de aires acondicionados registrados.

        Returns:
            int: Número total de aires.
        """
        try:
            return session.query(func.count(AireAcondicionado.id)).scalar() or 0
        except Exception as e:
            print(f"Error al contar aires: {e}")
            return 0 # Return 0 on error

    def contar_lecturas(self):
        """
        Cuenta el número total de lecturas registradas.

        Returns:
            int: Número total de lecturas.
        """
        try:
            return session.query(func.count(Lectura.id)).scalar() or 0
        except Exception as e:
            print(f"Error al contar lecturas: {e}")
            return 0 # Return 0 on error

    def contar_mantenimientos(self):
        """
        Cuenta el número total de mantenimientos registrados.

        Returns:
            int: Número total de mantenimientos.
        """
        try:
            return session.query(func.count(Mantenimiento.id)).scalar() or 0
        except Exception as e:
            print(f"Error al contar mantenimientos: {e}")
            return 0 # Return 0 on error

    def contar_alertas_activas(self):
        """
        Cuenta el número de alertas activas (basado en la última lectura de cada aire
        y los umbrales configurados).
        NOTA: Esta es una implementación básica. Podría optimizarse o basarse
              en una tabla de alertas separada si la lógica se vuelve compleja.

        Returns:
            int: Número de aires con lecturas fuera de umbrales activos.
        """
        try:
            # 1. Obtener la última lectura de cada aire
            subquery = session.query(
                Lectura.aire_id,
                func.max(Lectura.fecha).label('max_fecha')
            ).group_by(Lectura.aire_id).subquery()

            ultimas_lecturas = session.query(Lectura).join(
                subquery,
                (Lectura.aire_id == subquery.c.aire_id) & (Lectura.fecha == subquery.c.max_fecha)
            ).all()

            # 2. Obtener todos los umbrales activos
            umbrales_activos_df = self.obtener_umbrales_configuracion()
            umbrales_activos_df = umbrales_activos_df[umbrales_activos_df['notificar_activo'] == True]

            if umbrales_activos_df.empty:
                return 0 # No hay umbrales activos, no puede haber alertas

            # 3. Verificar cada última lectura contra los umbrales aplicables
            alertas_count = 0
            aires_con_alerta = set() # Para no contar el mismo aire múltiples veces

            for lectura in ultimas_lecturas:
                # Encontrar umbrales aplicables (específico del aire o global)
                umbrales_aplicables = umbrales_activos_df[
                    (umbrales_activos_df['es_global'] == True) |
                    (umbrales_activos_df['aire_id'] == lectura.aire_id)
                ]

                if umbrales_aplicables.empty:
                    continue # No hay umbrales para este aire

                # Verificar si la lectura está fuera de CUALQUIER umbral aplicable
                for _, umbral in umbrales_aplicables.iterrows():
                    fuera_limite = (
                        lectura.temperatura < umbral['temp_min'] or
                        lectura.temperatura > umbral['temp_max'] or
                        lectura.humedad < umbral['hum_min'] or
                        lectura.humedad > umbral['hum_max']
                    )
                    if fuera_limite:
                        if lectura.aire_id not in aires_con_alerta:
                            alertas_count += 1
                            aires_con_alerta.add(lectura.aire_id)
                        break # Pasamos al siguiente aire si ya encontramos una alerta para este

            return alertas_count

        except Exception as e:
            print(f"Error al contar alertas activas: {e}")
            traceback.print_exc()
            return 0 # Return 0 on error

    def obtener_ultimas_lecturas_con_info_aire(self, limite=5):
        """
        Obtiene las últimas N lecturas registradas, incluyendo información
        del aire acondicionado asociado (nombre, ubicación).

        Args:
            limite (int): Número máximo de lecturas a devolver.

        Returns:
            pd.DataFrame: DataFrame con las últimas lecturas y datos del aire.
                          Columnas esperadas por la API: id (lectura), aire_id,
                          nombre_aire, ubicacion_aire, temperatura, humedad, fecha.
        """
        try:
            # Alias para las tablas para claridad en el join
            LecturaAlias = aliased(Lectura)
            AireAlias = aliased(AireAcondicionado)

            # Consulta para obtener las últimas lecturas con join a la tabla de aires
            query = session.query(
                LecturaAlias.id,
                LecturaAlias.aire_id,
                AireAlias.nombre.label('nombre_aire'),
                AireAlias.ubicacion.label('ubicacion_aire'),
                LecturaAlias.temperatura,
                LecturaAlias.humedad,
                LecturaAlias.fecha
            ).join(
                AireAlias, LecturaAlias.aire_id == AireAlias.id
            ).order_by(
                desc(LecturaAlias.fecha) # Ordenar por fecha descendente
            ).limit(limite) # Limitar el número de resultados

            # Ejecutar la consulta y convertir a DataFrame
            ultimas_lecturas = query.all()

            # Convertir a DataFrame (SQLAlchemy >= 1.4)
            # Si usas una versión anterior, puedes necesitar pd.read_sql(query.statement, session.bind)
            # o iterar manualmente sobre los resultados para crear la lista de diccionarios.
            df = pd.DataFrame(ultimas_lecturas, columns=[
                'id', 'aire_id', 'nombre_aire', 'ubicacion_aire',
                'temperatura', 'humedad', 'fecha'
            ])

            return df

        except Exception as e:
            print(f"Error al obtener últimas lecturas con info aire: {e}")
            traceback.print_exc()
            return pd.DataFrame() # Devolver DataFrame vacío en caso de error
