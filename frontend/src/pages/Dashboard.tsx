import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert } from 'react-bootstrap';
import axios from 'axios';
import { FiWind, FiThermometer, FiDroplet, FiTool, FiAlertTriangle } from 'react-icons/fi';

interface ResumenData {
  totalAires: number;
  totalLecturas: number;
  totalMantenimientos: number;
  alertas: number;
  ultimasLecturas: any[];
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenData>({
    totalAires: 0,
    totalLecturas: 0,
    totalMantenimientos: 0,
    alertas: 0,
    ultimasLecturas: []
  });

  useEffect(() => {
    // Aquí cargaremos los datos del resumen del dashboard
    const cargarResumen = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // En una implementación real, obtendríamos todos estos datos de la API
        // Por ahora, simulamos la carga con datos de ejemplo
        setTimeout(() => {
          setResumen({
            totalAires: 7,
            totalLecturas: 210,
            totalMantenimientos: 15,
            alertas: 2,
            ultimasLecturas: [
              { id: 1, aire_id: 1, nombre: 'Aire Principal', ubicacion: 'Sala de Servidores', temperatura: 21.5, humedad: 45, fecha: '2023-04-08 14:00:00' },
              { id: 2, aire_id: 2, nombre: 'Aire Secundario', ubicacion: 'Oficina Central', temperatura: 24.2, humedad: 52, fecha: '2023-04-08 14:00:00' },
              { id: 3, aire_id: 3, nombre: 'Aire Auxiliar', ubicacion: 'Sala de Reuniones', temperatura: 22.8, humedad: 48, fecha: '2023-04-08 14:00:00' }
            ]
          });
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error al cargar resumen:', error);
        setError('Error al cargar los datos del resumen');
        setLoading(false);
      }
    };

    cargarResumen();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="dashboard-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{resumen.totalAires}</h3>
                  <small className="text-muted">Aires Acondicionados</small>
                </div>
                <FiWind size={40} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{resumen.totalLecturas}</h3>
                  <small className="text-muted">Lecturas Registradas</small>
                </div>
                <FiThermometer size={40} className="text-success" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{resumen.totalMantenimientos}</h3>
                  <small className="text-muted">Mantenimientos</small>
                </div>
                <FiTool size={40} className="text-info" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-0">{resumen.alertas}</h3>
                  <small className="text-muted">Alertas Activas</small>
                </div>
                <FiAlertTriangle size={40} className="text-warning" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Últimas lecturas */}
      <Card className="dashboard-card mb-4">
        <Card.Header>
          <h5 className="mb-0">Últimas Lecturas</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Aire</th>
                    <th>Ubicación</th>
                    <th>Temperatura</th>
                    <th>Humedad</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.ultimasLecturas.map((lectura) => (
                    <tr key={lectura.id}>
                      <td>{lectura.nombre}</td>
                      <td>{lectura.ubicacion}</td>
                      <td>
                        <FiThermometer className="me-1 text-danger" />
                        {lectura.temperatura} °C
                      </td>
                      <td>
                        <FiDroplet className="me-1 text-primary" />
                        {lectura.humedad} %
                      </td>
                      <td>{lectura.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Mensaje informativo */}
      <Alert variant="info">
        <Alert.Heading>Información</Alert.Heading>
        <p>
          Este es el resumen general del sistema de monitoreo de aires acondicionados.
          Utilice la barra lateral para navegar a las diferentes secciones y obtener
          información más detallada.
        </p>
      </Alert>
    </div>
  );
};

export default Dashboard;