import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, Badge, Dropdown } from 'react-bootstrap';
import { FiPlus, FiTrash2, FiFilter, FiThermometer, FiDroplet, FiCalendar, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';

interface Lectura {
  id: number;
  aire_id: number;
  fecha: string; // '2023-04-09 14:00:00'
  temperatura: number;
  humedad: number;
  aire_nombre?: string;
  ubicacion?: string;
}

interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

const Lecturas: React.FC = () => {
  const { user } = useAppContext();
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAire, setFiltroAire] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    aire_id: '',
    fecha: '',
    hora: '',
    temperatura: '',
    humedad: ''
  });

  // Verificar si el usuario puede eliminar lecturas
  const canDelete = user?.rol === 'admin' || user?.rol === 'supervisor';
  
  // Cargar aires y lecturas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar aires
        const airesResponse = await axios.get('/aires');
        setAires(airesResponse.data);
        
        // Cargar lecturas
        let url = '/lecturas';
        if (filtroAire) {
          url += `?aire_id=${filtroAire}`;
        }
        const lecturasResponse = await axios.get(url);
        console.log('Respuesta de /lecturas:', lecturasResponse.data); // <-- Añade esto para depurar

        // Añadir información del aire a cada lectura
        const lecturasConDetalles = lecturasResponse.data.map((lectura: Lectura) => {
          const aire = airesResponse.data.find((a: AireAcondicionado) => a.id === lectura.aire_id);
          return {
            ...lectura,
            aire_nombre: aire?.nombre || 'Desconocido',
            ubicacion: aire?.ubicacion || 'Desconocida'
          };
        });
        
        setLecturas(lecturasConDetalles);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtroAire]);

  // Filtrar por aire
  const handleFiltrarPorAire = (aireId: number | null) => {
    setFiltroAire(aireId);
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Abrir modal para agregar
  const handleAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    setFormData({
      aire_id: aires.length > 0 ? aires[0].id.toString() : '',
      fecha: today,
      hora: now,
      temperatura: '',
      humedad: ''
    });
    
    setShowModal(true);
  };

  // Eliminar lectura
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta lectura?')) {
      try {
        await axios.delete(`/lecturas/${id}`);
        setLecturas(lecturas.filter(lectura => lectura.id !== id));
      } catch (error) {
        console.error('Error al eliminar lectura:', error);
        setError('Error al eliminar la lectura');
      }
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        aire_id: parseInt(formData.aire_id),
        fecha: formData.fecha,
        hora: formData.hora,
        temperatura: parseFloat(formData.temperatura),
        humedad: parseFloat(formData.humedad)
      };
      
      const response = await axios.post('/lecturas', payload);
      
      // Obtener aire correspondiente
      const aire = aires.find(a => a.id === payload.aire_id);
      
      // Crear nueva lectura con datos completos
      const nuevaLectura: Lectura = {
        id: response.data.id,
        aire_id: payload.aire_id,
        fecha: `${payload.fecha} ${payload.hora}:00`,
        temperatura: payload.temperatura,
        humedad: payload.humedad,
        aire_nombre: aire?.nombre || 'Desconocido',
        ubicacion: aire?.ubicacion || 'Desconocida'
      };
      
      setLecturas([...lecturas, nuevaLectura]);
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar lectura:', error);
      setError('Error al guardar la lectura');
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString();
  };

  // Formatear hora
  const formatearHora = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Lecturas</h1>
        <div>
          <Dropdown className="d-inline-block me-2">
            <Dropdown.Toggle variant="outline-secondary" id="dropdown-filtro">
              <FiFilter className="me-2" /> 
              {filtroAire ? `Filtro: ${aires.find(a => a.id === filtroAire)?.nombre}` : 'Todos los aires'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleFiltrarPorAire(null)}>
                Todos los aires
              </Dropdown.Item>
              <Dropdown.Divider />
              {aires.map(aire => (
                <Dropdown.Item 
                  key={aire.id} 
                  onClick={() => handleFiltrarPorAire(aire.id)}
                >
                  {aire.nombre} - {aire.ubicacion}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Agregar Lectura
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="dashboard-card">
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando lecturas...</p>
            </div>
          ) : lecturas.length === 0 ? (
            <div className="text-center p-5">
              <div className="d-flex justify-content-center mb-3">
                <FiThermometer size={40} className="text-danger me-2" />
                <FiDroplet size={40} className="text-primary" />
              </div>
              <h4>No hay lecturas registradas</h4>
              <Button variant="primary" className="mt-3" onClick={handleAdd}>
                <FiPlus className="me-2" /> Agregar lectura
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Aire Acondicionado</th>
                    <th>Ubicación</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Temperatura</th>
                    <th>Humedad</th>
                    {canDelete && <th className="text-end">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {lecturas.map(lectura => (
                    <tr key={lectura.id}>
                      <td>{lectura.id}</td>
                      <td>{lectura.aire_nombre}</td>
                      <td>{lectura.ubicacion}</td>
                      <td>
                        <FiCalendar className="me-1" />
                        {formatearFecha(lectura.fecha)}
                      </td>
                      <td>
                        <FiClock className="me-1" />
                        {formatearHora(lectura.fecha)}
                      </td>
                      <td>
                        <Badge 
                          bg={lectura.temperatura > 25 ? 'danger' : lectura.temperatura < 18 ? 'info' : 'success'}
                        >
                          <FiThermometer className="me-1" />
                          {lectura.temperatura} °C
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          bg={lectura.humedad > 70 ? 'warning' : lectura.humedad < 30 ? 'secondary' : 'primary'}
                        >
                          <FiDroplet className="me-1" />
                          {lectura.humedad} %
                        </Badge>
                      </td>
                      {canDelete && (
                        <td className="text-end">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(lectura.id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de formulario */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Lectura</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Aire Acondicionado</Form.Label>
              <Form.Select
                name="aire_id"
                value={formData.aire_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un aire acondicionado</option>
                {aires.map(aire => (
                  <option key={aire.id} value={aire.id}>
                    {aire.nombre} - {aire.ubicacion}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Temperatura (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="temperatura"
                    value={formData.temperatura}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Humedad (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="humedad"
                    value={formData.humedad}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Lecturas;