
from dotenv import load_dotenv
import os
from database import init_db

# Cargar variables de entorno
load_dotenv()

if __name__ == "__main__":
    # Verificar que existe la variable de entorno DATABASE_URL
    if not os.environ.get('DATABASE_URL'):
        print("Error: DATABASE_URL no está configurada en el archivo .env")
        exit(1)
        
    print("Inicializando base de datos...")
    init_db()
    print("Base de datos inicializada correctamente.")
