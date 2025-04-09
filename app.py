from flask import Flask, render_template, request, jsonify
from data_manager import DataManager
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
data_manager = DataManager()

@app.route('/')
def index():
    aires = data_manager.obtener_aires()
    return render_template('index.html', aires=aires)

@app.route('/api/lecturas', methods=['GET'])
def get_lecturas():
    lecturas = data_manager.obtener_lecturas()
    return jsonify(lecturas.to_dict('records'))

@app.route('/api/lecturas', methods=['POST'])
def add_lectura():
    data = request.json
    lectura_id = data_manager.agregar_lectura(
        data['aire_id'],
        data['fecha'],
        data['temperatura'],
        data['humedad']
    )
    return jsonify({'id': lectura_id}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)