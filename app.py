
from flask import Flask, render_template, request, jsonify
from data_manager import DataManager

app = Flask(__name__, static_folder='static')
data_manager = DataManager()

@app.route('/')
def index():
    aires = data_manager.obtener_aires()
    return render_template('index.html', aires=aires)

@app.route('/api/aires', methods=['GET'])
def get_aires():
    aires = data_manager.obtener_aires()
    return jsonify([{'id': aire.id, 'nombre': aire.nombre, 'ubicacion': aire.ubicacion} for aire in aires])

@app.route('/api/lecturas/<int:aire_id>', methods=['GET'])
def get_lecturas(aire_id):
    lecturas = data_manager.obtener_lecturas_por_aire(aire_id)
    return jsonify([{
        'fecha': str(lectura.fecha),
        'temperatura': lectura.temperatura,
        'humedad': lectura.humedad
    } for lectura in lecturas])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
