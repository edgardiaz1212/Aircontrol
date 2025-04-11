# backend/init_db.py
import os
from dotenv import load_dotenv

# Carga las variables de entorno PRIMERO
# Busca el .env subiendo desde la ubicación de este script
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env') # Sube un nivel para encontrar .env en la raíz
load_dotenv(dotenv_path=dotenv_path)

# AHORA importa los módulos que dependen de las variables de entorno
from database import init_db # Ahora database.py se ejecutará DESPUÉS de load_dotenv

if __name__ == '__main__':
    print("Inicializando la base de datos...")
    try:
        # Verifica si DATABASE_URL se cargó correctamente (opcional, para depurar)
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print("ERROR: La variable de entorno DATABASE_URL no se encontró.")
            print(f"Intentando cargar desde: {dotenv_path}")
        else:
            print(f"Usando DATABASE_URL: {db_url[:15]}...") # Muestra solo una parte por seguridad
            init_db()
            print("Base de datos inicializada correctamente.")
    except Exception as e:
        print(f"Ocurrió un error al inicializar la base de datos: {e}")

