import pandas as pd
import os
import numpy as np
import io
from datetime import datetime
from database import session, AireAcondicionado, Lectura, Mantenimiento, UmbralConfiguracion, Usuario, init_db , OtroEquipo
from cryptography.fernet import Fernet
import hashlib
from sqlalchemy import func, distinct, desc
from sqlalchemy.orm import aliased
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
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
                'fecha_instalacion': aire.fecha_instalacion,
                'tipo': aire.tipo, 
                'toneladas': aire.toneladas,
                'evaporadora_operativa': aire.evaporadora_operativa,
                'evaporadora_marca': aire.evaporadora_marca,
                'evaporadora_modelo': aire.evaporadora_modelo,
                'evaporadora_serial': aire.evaporadora_serial,
                'evaporadora_codigo_inventario': aire.evaporadora_codigo_inventario,
                'evaporadora_ubicacion_instalacion': aire.evaporadora_ubicacion_instalacion,
                'condensadora_operativa': aire.condensadora_operativa,
                'condensadora_marca': aire.condensadora_marca,
                'condensadora_modelo': aire.condensadora_modelo,
                'condensadora_serial': aire.condensadora_serial,
                'condensadora_codigo_inventario': aire.condensadora_codigo_inventario,
                'condensadora_ubicacion_instalacion': aire.condensadora_ubicacion_instalacion,
                
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
    
    def agregar_aire(self, nombre, ubicacion, fecha_instalacion, tipo, toneladas,
                     evaporadora_operativa, evaporadora_marca, evaporadora_modelo,
                     evaporadora_serial, evaporadora_codigo_inventario,
                     evaporadora_ubicacion_instalacion, condensadora_operativa,
                     condensadora_marca, condensadora_modelo, condensadora_serial,
                     condensadora_codigo_inventario, condensadora_ubicacion_instalacion):
        """
        Agrega un nuevo aire acondicionado a la base de datos con todos sus detalles.
        Maneja errores durante el proceso.
        """
        try:
            # Crear nuevo aire acondicionado en la base de datos con todos los campos
            nuevo_aire = AireAcondicionado(
                nombre=nombre,
                ubicacion=ubicacion,
                fecha_instalacion=fecha_instalacion,
                tipo=tipo,
                toneladas=toneladas,
                evaporadora_operativa=evaporadora_operativa,
                evaporadora_marca=evaporadora_marca,
                evaporadora_modelo=evaporadora_modelo,
                evaporadora_serial=evaporadora_serial,
                evaporadora_codigo_inventario=evaporadora_codigo_inventario,
                evaporadora_ubicacion_instalacion=evaporadora_ubicacion_instalacion,
                condensadora_operativa=condensadora_operativa,
                condensadora_marca=condensadora_marca,
                condensadora_modelo=condensadora_modelo,
                condensadora_serial=condensadora_serial,
                condensadora_codigo_inventario=condensadora_codigo_inventario,
                condensadora_ubicacion_instalacion=condensadora_ubicacion_instalacion
            )

            session.add(nuevo_aire)
            session.commit() # Intentar guardar en la BD

            return nuevo_aire.id # Devolver ID si el commit fue exitoso

        except Exception as e:
            print(f"!!! ERROR en data_manager.agregar_aire: {e}", file=sys.stderr)
            traceback.print_exc() # Imprime el traceback completo en la consola del servidor
            session.rollback() # MUY IMPORTANTE: Deshacer cambios en la sesión si hubo error
            return None 
        
    def actualizar_aire(self, aire_id, nombre, ubicacion, fecha_instalacion, tipo, toneladas,
                         evaporadora_operativa, evaporadora_marca, evaporadora_modelo,
                         evaporadora_serial, evaporadora_codigo_inventario,
                         evaporadora_ubicacion_instalacion, condensadora_operativa,
                         condensadora_marca, condensadora_modelo, condensadora_serial,
                         condensadora_codigo_inventario, condensadora_ubicacion_instalacion):
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
            try:
                aire.nombre = nombre
                aire.ubicacion = ubicacion
                # from datetime import datetime
                    # if isinstance(fecha_instalacion, str):
                    #     try:
                    #         aire.fecha_instalacion = datetime.strptime(fecha_instalacion, '%Y-%m-%d').date()
                    #     except ValueError:
                    #         print(f"Error: Formato de fecha inválido '{fecha_instalacion}' para aire ID {aire_id}")
                    #         # Decide cómo manejar el error, ¿quizás no actualizar la fecha?
                    #         # O devolver False / lanzar una excepción
                    # else:
                    #     aire.fecha_instalacion = fecha_instalacion # Asume que ya es Date o None
                aire.fecha_instalacion = fecha_instalacion
                aire.tipo = tipo
                # Convierte toneladas a float o None si está vacío/cero
                aire.toneladas = float(toneladas) if toneladas else None

                    # Evaporadora
                aire.evaporadora_operativa = bool(evaporadora_operativa)
                aire.evaporadora_marca = evaporadora_marca
                aire.evaporadora_modelo = evaporadora_modelo
                aire.evaporadora_serial = evaporadora_serial
                aire.evaporadora_codigo_inventario = evaporadora_codigo_inventario
                aire.evaporadora_ubicacion_instalacion = evaporadora_ubicacion_instalacion

                        # Condensadora
                aire.condensadora_operativa = bool(condensadora_operativa)
                aire.condensadora_marca = condensadora_marca
                aire.condensadora_modelo = condensadora_modelo
                aire.condensadora_serial = condensadora_serial
                aire.condensadora_codigo_inventario = condensadora_codigo_inventario
                aire.condensadora_ubicacion_instalacion = condensadora_ubicacion_instalacion


                session.commit()
                return True
        
            except Exception as e:
                print(f"!!! ERROR al actualizar aire ID {aire_id} en data_manager: {e}", file=sys.stderr)
                traceback.print_exc()
                session.rollback() # Deshacer cambios si hubo error en el commit
                return False
        else:
            # El aire con ese ID no fue encontrado
            print(f"Advertencia: Intento de actualizar aire no existente con ID {aire_id}")
            return False
    
    def agregar_lectura(self, aire_id, fecha, temperatura, humedad):
        try:
            # Crear nueva lectura en la base de datos
            nueva_lectura = Lectura(
                aire_id=aire_id,
                fecha=fecha, # Asegúrate que la columna 'fecha' en tu BD acepte datetime
                temperatura=temperatura,
                humedad=humedad
            )

            session.add(nueva_lectura)
            session.flush() # Opcional: asigna el ID antes del commit
            session.commit() # Intentar guardar en la BD

            return nueva_lectura.id # Devolver ID si el commit fue exitoso

        except Exception as e:
            print(f"!!! ERROR en data_manager.agregar_lectura: {e}", file=sys.stderr)
            traceback.print_exc() # Imprime el traceback completo en la consola del servidor
            session.rollback() # MUY IMPORTANTE: Deshacer cambios en la sesión si hubo error
            return None # Indicar fallo a la función que llamó (app.py)
    
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
        """
        Obtiene estadísticas para un aire acondicionado específico.

        Args:
            aire_id: ID del aire acondicionado.

        Returns:
            Diccionario con estadísticas (estructura plana) o None si no hay datos.
        """
        try:
            result = session.query(
                func.avg(Lectura.temperatura).label('temp_avg'),
                func.min(Lectura.temperatura).label('temp_min'),
                func.max(Lectura.temperatura).label('temp_max'),
                func.stddev(Lectura.temperatura).label('temp_std'), # Desviación estándar de temperatura
                func.avg(Lectura.humedad).label('hum_avg'),
                func.min(Lectura.humedad).label('hum_min'),
                func.max(Lectura.humedad).label('hum_max'),
                func.stddev(Lectura.humedad).label('hum_std')  # Desviación estándar de humedad
            ).filter(Lectura.aire_id == aire_id).first()

            # Si no hay lecturas para este aire, devolver valores predeterminados
            if result is None or result.temp_avg is None: # Verificar si la consulta devolvió algo
                return {
                    'temperatura_promedio': 0,
                    'temperatura_minima': 0,
                    'temperatura_maxima': 0,
                    'temperatura_desviacion': 0,
                    'humedad_promedio': 0,
                    'humedad_minima': 0,
                    'humedad_maxima': 0,
                    'humedad_desviacion': 0,
                }

            # Convertir a diccionario con estructura PLANA
            return {
                'temperatura_promedio': round(result.temp_avg, 2) if result.temp_avg is not None else 0,
                'temperatura_minima': round(result.temp_min, 2) if result.temp_min is not None else 0,
                'temperatura_maxima': round(result.temp_max, 2) if result.temp_max is not None else 0,
                'temperatura_desviacion': round(result.temp_std, 2) if result.temp_std is not None else 0,
                'humedad_promedio': round(result.hum_avg, 2) if result.hum_avg is not None else 0,
                'humedad_minima': round(result.hum_min, 2) if result.hum_min is not None else 0,
                'humedad_maxima': round(result.hum_max, 2) if result.hum_max is not None else 0,
                'humedad_desviacion': round(result.hum_std, 2) if result.hum_std is not None else 0,
            }
        except Exception as e:
            print(f"Error en obtener_estadisticas_por_aire para ID {aire_id}: {e}", file=sys.stderr)
            traceback.print_exc()
            # Devolver un diccionario vacío o con ceros podría ser mejor que None para evitar errores en el frontend
            return {
                'temperatura_promedio': 0, 'temperatura_minima': 0, 'temperatura_maxima': 0, 'temperatura_desviacion': 0,
                'humedad_promedio': 0, 'humedad_minima': 0, 'humedad_maxima': 0, 'humedad_desviacion': 0,
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
                'temperatura_promedio': 0,
                'temperatura_minima': 0,
                'temperatura_maxima': 0,
                'humedad_promedio': 0,
                'humedad_minima': 0,
                'humedad_maxima': 0,
                'total_lecturas': 0
            }
        
        # Convertir a diccionario con estructura PLANA
        return {
            'temperatura_promedio': round(result.temp_avg, 2) if result.temp_avg else 0,
            'temperatura_minima': round(result.temp_min, 2) if result.temp_min else 0,
            'temperatura_maxima': round(result.temp_max, 2) if result.temp_max else 0,
            'humedad_promedio': round(result.hum_avg, 2) if result.hum_avg else 0,
            'humedad_minima': round(result.hum_min, 2) if result.hum_min else 0,
            'humedad_maxima': round(result.hum_max, 2) if result.hum_max else 0,
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
            
    def obtener_aire_por_id(self, aire_id):
        """
        Obtiene un aire acondicionado específico por su ID.

        Args:
            aire_id: ID del aire acondicionado a obtener.

        Returns:
            Objeto AireAcondicionado o None si no existe.
        """
        try:
            # Validar que aire_id sea un entero razonable si es necesario
            if not isinstance(aire_id, int) or aire_id <= 0:
                print(f"Advertencia: ID de aire inválido solicitado: {aire_id}", file=sys.stderr)
                return None

            # Consultar la base de datos
            return session.query(AireAcondicionado).filter(AireAcondicionado.id == aire_id).first()

        except Exception as e:
            print(f"Error en obtener_aire_por_id para ID {aire_id}: {e}", file=sys.stderr)
            traceback.print_exc() # Imprime el traceback completo en la consola del servidor
            return None # Devolver None en caso de error
    
    def agregar_otro_equipo(self, nombre, tipo, ubicacion=None, marca=None, modelo=None, serial=None,
                            codigo_inventario=None, fecha_instalacion=None, estado_operativo=True, notas=None):
        """Agrega un nuevo equipo diverso a la base de datos."""
        try:
            # Convertir fecha si es string
            if isinstance(fecha_instalacion, str):
                try:
                    fecha_instalacion = datetime.strptime(fecha_instalacion, '%Y-%m-%d').date()
                except ValueError:
                    print(f"Formato de fecha inválido para {fecha_instalacion}. Se guardará como None.", file=sys.stderr)
                    fecha_instalacion = None

            nuevo_equipo = OtroEquipo(
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
            session.add(nuevo_equipo)
            session.commit()
            print(f"OtroEquipo agregado: ID={nuevo_equipo.id}, Nombre={nombre}, Tipo={tipo}")
            return nuevo_equipo.id
        except IntegrityError as e:
            session.rollback()
            print(f"Error de integridad al agregar otro equipo (¿serial o código inventario duplicado?): {e}", file=sys.stderr)
            return None
        except SQLAlchemyError as e:
            session.rollback()
            print(f"Error de base de datos al agregar otro equipo: {e}", file=sys.stderr)
            traceback.print_exc()
            return None
        except Exception as e:
            session.rollback()
            print(f"Error inesperado al agregar otro equipo: {e}", file=sys.stderr)
            traceback.print_exc()
            return None

    def obtener_otros_equipos(self):
        """Obtiene todos los equipos diversos."""
        try:
            query = session.query(OtroEquipo).order_by(OtroEquipo.nombre)
            df = pd.read_sql(query.statement, session.bind)
            # Convertir tipos para JSON si es necesario (fechas, booleanos)
            if not df.empty:
                 if 'fecha_instalacion' in df.columns:
                     df['fecha_instalacion'] = pd.to_datetime(df['fecha_instalacion']).dt.strftime('%Y-%m-%d').fillna('')
                 if 'estado_operativo' in df.columns:
                     df['estado_operativo'] = df['estado_operativo'].astype(bool)
            return df
        except Exception as e:
            print(f"Error al obtener otros equipos: {e}", file=sys.stderr)
            return pd.DataFrame() # Devolver DataFrame vacío en caso de error

    def obtener_otro_equipo_por_id(self, equipo_id):
        """Obtiene un equipo diverso específico por su ID."""
        try:
            return session.query(OtroEquipo).get(equipo_id)
        except Exception as e:
            print(f"Error al obtener otro equipo por ID {equipo_id}: {e}", file=sys.stderr)
            return None

    def actualizar_otro_equipo(self, equipo_id, **kwargs):
        """Actualiza los datos de un equipo diverso."""
        try:
            equipo = session.query(OtroEquipo).get(equipo_id)
            if not equipo:
                print(f"No se encontró OtroEquipo con ID {equipo_id} para actualizar.", file=sys.stderr)
                return False

            allowed_keys = ['nombre', 'tipo', 'ubicacion', 'marca', 'modelo', 'serial',
                            'codigo_inventario', 'fecha_instalacion', 'estado_operativo', 'notas']

            for key, value in kwargs.items():
                if key in allowed_keys:
                    # Convertir fecha si es string y es la llave correcta
                    if key == 'fecha_instalacion' and isinstance(value, str):
                         try:
                             value = datetime.strptime(value, '%Y-%m-%d').date() if value else None
                         except ValueError:
                             print(f"Formato de fecha inválido para {key}: {value}. No se actualizará.", file=sys.stderr)
                             continue # Saltar esta actualización
                    # Convertir booleano si es necesario
                    elif key == 'estado_operativo':
                         value = bool(value)

                    setattr(equipo, key, value)

            equipo.ultima_modificacion = datetime.now() # Actualizar timestamp
            session.commit()
            print(f"OtroEquipo actualizado: ID={equipo_id}")
            return True
        except IntegrityError as e:
            session.rollback()
            print(f"Error de integridad al actualizar otro equipo {equipo_id} (¿serial o código inventario duplicado?): {e}", file=sys.stderr)
            return False
        except SQLAlchemyError as e:
            session.rollback()
            print(f"Error de base de datos al actualizar otro equipo {equipo_id}: {e}", file=sys.stderr)
            traceback.print_exc()
            return False
        except Exception as e:
            session.rollback()
            print(f"Error inesperado al actualizar otro equipo {equipo_id}: {e}", file=sys.stderr)
            traceback.print_exc()
            return False

    def eliminar_otro_equipo(self, equipo_id):
        """Elimina un equipo diverso (y sus mantenimientos asociados por cascade)."""
        try:
            equipo = session.query(OtroEquipo).get(equipo_id)
            if equipo:
                session.delete(equipo)
                session.commit()
                print(f"OtroEquipo eliminado: ID={equipo_id}")
                return True
            else:
                print(f"No se encontró OtroEquipo con ID {equipo_id} para eliminar.", file=sys.stderr)
                return False
        except SQLAlchemyError as e:
            session.rollback()
            print(f"Error de base de datos al eliminar otro equipo {equipo_id}: {e}", file=sys.stderr)
            traceback.print_exc()
            return False
        except Exception as e:
            session.rollback()
            print(f"Error inesperado al eliminar otro equipo {equipo_id}: {e}", file=sys.stderr)
            traceback.print_exc()
            return False
    
    def agregar_mantenimiento(self, tipo_mantenimiento, descripcion, tecnico,
                              aire_id=None, otro_equipo_id=None, # Aceptar ambos IDs
                              imagen_file=None):
        """Agrega un registro de mantenimiento para un Aire o OtroEquipo."""
        # Validar que solo uno de los IDs esté presente
        if (aire_id is None and otro_equipo_id is None) or \
           (aire_id is not None and otro_equipo_id is not None):
            print("Error: Se debe proporcionar 'aire_id' O 'otro_equipo_id', pero no ambos o ninguno.", file=sys.stderr)
            return None

        try:
            imagen_datos = None
            imagen_nombre = None
            imagen_tipo = None
            if imagen_file and imagen_file.filename != '':
                imagen_nombre = imagen_file.filename
                imagen_tipo = imagen_file.mimetype
                imagen_datos = imagen_file.read()

            nuevo_mantenimiento = Mantenimiento(
                # --- CAMBIO: Asignar el ID correspondiente ---
                aire_id=aire_id,
                otro_equipo_id=otro_equipo_id,
                # --- FIN CAMBIO ---
                fecha=datetime.now(),
                tipo_mantenimiento=tipo_mantenimiento,
                descripcion=descripcion,
                tecnico=tecnico,
                imagen_nombre=imagen_nombre,
                imagen_tipo=imagen_tipo,
                imagen_datos=imagen_datos
            )
            session.add(nuevo_mantenimiento)
            session.commit()
            target_type = "Aire" if aire_id else "OtroEquipo"
            target_id_val = aire_id if aire_id else otro_equipo_id
            print(f"Mantenimiento agregado: ID={nuevo_mantenimiento.id} para {target_type} ID={target_id_val}")
            return nuevo_mantenimiento.id
        except SQLAlchemyError as e:
            session.rollback()
            print(f"Error de base de datos al agregar mantenimiento: {e}", file=sys.stderr)
            traceback.print_exc()
            return None
        except Exception as e:
            session.rollback()
            print(f"Error inesperado al agregar mantenimiento: {e}", file=sys.stderr)
            traceback.print_exc()
            return None

    def obtener_mantenimientos(self, aire_id=None, otro_equipo_id=None): # Añadir filtro por otro_equipo_id
        """Obtiene los registros de mantenimiento, opcionalmente filtrados."""
        try:
            query = session.query(
                Mantenimiento.id,
                Mantenimiento.aire_id,
                Mantenimiento.otro_equipo_id, # Incluir nuevo ID
                Mantenimiento.fecha,
                Mantenimiento.tipo_mantenimiento,
                Mantenimiento.descripcion,
                Mantenimiento.tecnico,
                Mantenimiento.imagen_datos, # Para verificar si hay imagen
                # Unir opcionalmente para obtener nombres/ubicaciones
                AireAcondicionado.nombre.label('aire_nombre'),
                AireAcondicionado.ubicacion.label('aire_ubicacion'),
                OtroEquipo.nombre.label('otro_equipo_nombre'),
                OtroEquipo.tipo.label('otro_equipo_tipo'),
                OtroEquipo.ubicacion.label('otro_equipo_ubicacion')
            ).outerjoin(AireAcondicionado, Mantenimiento.aire_id == AireAcondicionado.id)\
             .outerjoin(OtroEquipo, Mantenimiento.otro_equipo_id == OtroEquipo.id) # Join con OtroEquipo

            if aire_id:
                query = query.filter(Mantenimiento.aire_id == aire_id)
            elif otro_equipo_id: # Nuevo filtro
                query = query.filter(Mantenimiento.otro_equipo_id == otro_equipo_id)

            query = query.order_by(Mantenimiento.fecha.desc())

            df = pd.read_sql(query.statement, session.bind)

            # Procesamiento adicional (similar a como lo tenías antes)
            if not df.empty:
                df['fecha'] = pd.to_datetime(df['fecha']) # Mantener como datetime para posible uso futuro
                df['tiene_imagen'] = df['imagen_datos'].notna()
                # Crear columnas unificadas para nombre y ubicación del equipo
                df['equipo_nombre'] = df['aire_nombre'].fillna(df['otro_equipo_nombre'])
                df['equipo_ubicacion'] = df['aire_ubicacion'].fillna(df['otro_equipo_ubicacion'])
                df['equipo_tipo'] = 'Aire Acondicionado' # Valor por defecto
                df.loc[df['otro_equipo_id'].notna(), 'equipo_tipo'] = df['otro_equipo_tipo'] # Sobrescribir si es OtroEquipo

                # Eliminar columnas redundantes o no necesarias para el frontend básico
                df = df.drop(columns=['imagen_datos', 'aire_nombre', 'aire_ubicacion',
                                      'otro_equipo_nombre', 'otro_equipo_tipo', 'otro_equipo_ubicacion'])

                # Convertir IDs a enteros (manejando nulos si pd.read_sql los trae como float)
                for col in ['aire_id', 'otro_equipo_id']:
                    if col in df.columns:
                         # Convertir a Int64 que soporta nulos, luego llenar NaN con 0 y convertir a int
                         # O manejarlo de otra forma si prefieres mantener None/null en JSON
                         df[col] = df[col].astype('Int64').fillna(0).astype(int)


            return df
        except Exception as e:
            print(f"Error al obtener mantenimientos: {e}", file=sys.stderr)
            traceback.print_exc()
            return pd.DataFrame()

    def obtener_mantenimiento_por_id(self, mantenimiento_id):
        """Obtiene un mantenimiento específico por su ID."""
        try:
            # Podrías hacer un join aquí también si necesitas info del equipo asociado
            return session.query(Mantenimiento).get(mantenimiento_id)
        except Exception as e:
            print(f"Error al obtener mantenimiento por ID {mantenimiento_id}: {e}", file=sys.stderr)
            return None
    
    
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
    
    def obtener_imagen_mantenimiento_base64(self, mantenimiento_id):
        """
        Obtiene la imagen de un mantenimiento específico en formato base64.

        Args:
            mantenimiento_id: ID del mantenimiento.

        Returns:
            String con la imagen en base64 (ej: "data:image/jpeg;base64,...") o None si no hay imagen o no existe el mantenimiento.
        """
        try:
            mantenimiento = self.obtener_mantenimiento_por_id(mantenimiento_id)

            if mantenimiento and mantenimiento.imagen_datos and mantenimiento.imagen_tipo:
                # Usar la lógica existente en el modelo (o replicarla aquí)
                # return mantenimiento.get_imagen_base64() # Si el método existe y funciona

                # O replicar la lógica aquí:
                b64_data = base64.b64encode(mantenimiento.imagen_datos).decode('utf-8')
                return f"data:{mantenimiento.imagen_tipo};base64,{b64_data}"
            else:
                return None # No encontrado o sin imagen

        except Exception as e:
            print(f"Error en obtener_imagen_mantenimiento_base64 para ID {mantenimiento_id}: {e}")
            traceback.print_exc()
            return None # Devolver None en caso de error
    
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
        Cuenta el número de alertas activas...
        """
        print("\n--- [DEBUG] Iniciando contar_alertas_activas ---") # <-- DEBUG START
        try:
            # 1. Obtener la última lectura de cada aire
            print("[DEBUG] Obteniendo últimas lecturas...") # <-- DEBUG
            subquery = session.query(
                Lectura.aire_id,
                func.max(Lectura.fecha).label('max_fecha')
            ).group_by(Lectura.aire_id).subquery()

            ultimas_lecturas = session.query(Lectura).join(
                subquery,
                (Lectura.aire_id == subquery.c.aire_id) & (Lectura.fecha == subquery.c.max_fecha)
            ).all()
            print(f"[DEBUG] Últimas lecturas encontradas: {len(ultimas_lecturas)}") # <-- DEBUG
            # for lec in ultimas_lecturas: # Descomentar si necesitas ver detalles
            #     print(f"  [DEBUG] Aire ID: {lec.aire_id}, Fecha: {lec.fecha}, Temp: {lec.temperatura}, Hum: {lec.humedad}")

            # 2. Obtener todos los umbrales activos
            print("[DEBUG] Obteniendo umbrales...") # <-- DEBUG
            umbrales_todos_df = self.obtener_umbrales_configuracion() # Obtener TODOS primero
            print(f"[DEBUG] Total umbrales obtenidos (antes de filtrar): {len(umbrales_todos_df)}") # <-- DEBUG
            # print(umbrales_todos_df) # Descomentar para ver todos los umbrales

            umbrales_activos_df = umbrales_todos_df[umbrales_todos_df['notificar_activo'] == True]
            print(f"[DEBUG] Umbrales ACTIVOS filtrados: {len(umbrales_activos_df)}") # <-- DEBUG
            # print(umbrales_activos_df) # Descomentar para ver los activos

            if umbrales_activos_df.empty:
                print("[DEBUG] No hay umbrales activos. Devolviendo 0.") # <-- DEBUG
                return 0 # No hay umbrales activos, no puede haber alertas

            # 3. Verificar cada última lectura contra los umbrales aplicables
            alertas_count = 0
            aires_con_alerta = set() # Para no contar el mismo aire múltiples veces
            print("[DEBUG] Iniciando verificación de lecturas vs umbrales...") # <-- DEBUG

            for lectura in ultimas_lecturas:
                print(f"\n[DEBUG] Verificando Aire ID: {lectura.aire_id} (T:{lectura.temperatura}, H:{lectura.humedad})") # <-- DEBUG
                # Encontrar umbrales aplicables (específico del aire o global)
                # Asegurarse que la comparación de aire_id funciona (tipos)
                # umbrales_activos_df['aire_id'] puede ser NaN para globales, lectura.aire_id es int
                try:
                    # Convertir aire_id del DF a Int64 para manejar NaN y comparar con int
                    col_aire_id_df = pd.to_numeric(umbrales_activos_df['aire_id'], errors='coerce').astype('Int64')
                    umbrales_aplicables = umbrales_activos_df[
                        (umbrales_activos_df['es_global'] == True) |
                        (col_aire_id_df == lectura.aire_id) # Comparación más segura
                    ]
                except Exception as e_filter:
                     print(f"[ERROR-DEBUG] Error al filtrar umbrales aplicables: {e_filter}")
                     umbrales_aplicables = pd.DataFrame() # Vacío para evitar más errores


                print(f"[DEBUG]   Umbrales aplicables para este aire: {len(umbrales_aplicables)}") # <-- DEBUG
                # print(umbrales_aplicables[['id', 'nombre', 'es_global', 'aire_id', 'temp_min', 'temp_max', 'hum_min', 'hum_max']]) # Descomentar para detalles

                if umbrales_aplicables.empty:
                    print("[DEBUG]   No hay umbrales aplicables para este aire.") # <-- DEBUG
                    continue # No hay umbrales para este aire

                # Verificar si la lectura está fuera de CUALQUIER umbral aplicable
                alerta_encontrada_para_este_aire = False
                for _, umbral in umbrales_aplicables.iterrows():
                    print(f"[DEBUG]     Comparando con Umbral ID: {umbral['id']} (T:[{umbral['temp_min']},{umbral['temp_max']}], H:[{umbral['hum_min']},{umbral['hum_max']}])") # <-- DEBUG
                    try:
                        # Convertir a float por si acaso vienen como string o algo inesperado
                        temp_lectura = float(lectura.temperatura)
                        hum_lectura = float(lectura.humedad)
                        temp_min = float(umbral['temp_min'])
                        temp_max = float(umbral['temp_max'])
                        hum_min = float(umbral['hum_min'])
                        hum_max = float(umbral['hum_max'])

                        fuera_limite_temp = (
                            temp_lectura < temp_min or
                            temp_lectura > temp_max
                        )
                        fuera_limite_hum = (
                            hum_lectura < hum_min or
                            hum_lectura > hum_max
                        )
                        print(f"[DEBUG]       Temp fuera: {fuera_limite_temp} ({temp_lectura} vs [{temp_min}, {temp_max}])") # <-- DEBUG
                        print(f"[DEBUG]       Hum fuera: {fuera_limite_hum} ({hum_lectura} vs [{hum_min}, {hum_max}])") # <-- DEBUG

                        if fuera_limite_temp or fuera_limite_hum:
                            print(f"[DEBUG]       ¡VIOLACIÓN DETECTADA por umbral {umbral['id']}!") # <-- DEBUG
                            alerta_encontrada_para_este_aire = True
                            if lectura.aire_id not in aires_con_alerta:
                                print(f"[DEBUG]       Añadiendo Aire ID {lectura.aire_id} a alertas. Incrementando contador.") # <-- DEBUG
                                alertas_count += 1
                                aires_con_alerta.add(lectura.aire_id)
                            else:
                                print(f"[DEBUG]       Aire ID {lectura.aire_id} ya estaba en alertas.") # <-- DEBUG
                            break # Pasamos al siguiente aire si ya encontramos una alerta para este
                        else:
                             print(f"[DEBUG]       Dentro de límites para umbral {umbral['id']}.") # <-- DEBUG
                    except Exception as e_compare:
                        print(f"[ERROR-DEBUG] Error al comparar lectura con umbral {umbral['id']}: {e_compare}") # <-- DEBUG


                if not alerta_encontrada_para_este_aire:
                     print(f"[DEBUG]   Lectura DENTRO de todos los umbrales aplicables para Aire ID {lectura.aire_id}.") # <-- DEBUG


            print(f"\n--- [DEBUG] Fin contar_alertas_activas. Total alertas contadas: {alertas_count} ---") # <-- DEBUG
            return alertas_count

        except Exception as e:
            print(f"!!! ERROR GENERAL en contar_alertas_activas: {e}", file=sys.stderr) # <-- DEBUG ERROR
            traceback.print_exc()
            return 0 # Return 0 on error

    def contar_otros_equipos(self):
        """Cuenta el número total de otros equipos registrados."""
        try:
            return session.query(OtroEquipo).count()
        except Exception as e:
            print(f"Error al contar otros equipos: {e}", file=sys.stderr)
            return 0
        
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
