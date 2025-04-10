import React from 'react';
import { Card, Row, Col, Form, Spinner, Table } from 'react-bootstrap';
import { FiMapPin, FiThermometer, FiDroplet, FiUsers, FiActivity } from 'react-icons/fi'; // Añadir iconos si se usan
// Importar la interfaz correcta desde el componente padre
import { EstadisticasUbicacion } from '../../pages/Estadisticas';

interface EstadisticasPorUbicacionProps {
  ubicaciones: string[];
  ubicacionSeleccionada: string | null;
  setUbicacionSeleccionada: (ubicacion: string | null) => void;
  estadisticasUbicacion: EstadisticasUbicacion[]; // Usar la interfaz importada
  loadingUbicacion: boolean;
}

const EstadisticasPorUbicacion: React.FC<EstadisticasPorUbicacionProps> = ({
  ubicaciones,
  ubicacionSeleccionada,
  setUbicacionSeleccionada,
  estadisticasUbicacion,
  loadingUbicacion
}) => {
  return (
    <div>
      {/* Selector de Ubicación (sin cambios) */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filtrar por Ubicación</Form.Label>
            <Form.Select
              value={ubicacionSeleccionada || ''}
              onChange={e => setUbicacionSeleccionada(e.target.value || null)}
              disabled={loadingUbicacion}
            >
              <option value="">Todas las ubicaciones</option>
              {ubicaciones.map((ubicacion, index) => (
                <option key={index} value={ubicacion}>
                  {ubicacion}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Tabla de Estadísticas */}
      <Card className="dashboard-card">
        <Card.Header>Estadísticas por Ubicación</Card.Header>
        <Card.Body>
          {loadingUbicacion ? (
            <div className="text-center p-5"><Spinner animation="border" size="sm" /> Cargando datos...</div>
          ) : estadisticasUbicacion.length > 0 ? (
            <Table striped hover responsive size="sm">
              <thead>
                <tr>
                  <th>Ubicación</th>
                  <th><FiUsers className="me-1" />Aires</th>
                  <th><FiThermometer className="me-1 text-danger" />Temp. Prom.</th>
                  <th>Temp. Mín.</th>
                  <th>Temp. Máx.</th>
                  <th><FiDroplet className="me-1 text-primary" />Hum. Prom.</th>
                  <th>Hum. Mín.</th>
                  <th>Hum. Máx.</th>
                  <th><FiActivity className="me-1" />Lecturas</th>
                </tr>
              </thead>
              <tbody>
                {estadisticasUbicacion
                  // Filtrar si hay una ubicación seleccionada
                  .filter(e => !ubicacionSeleccionada || e.ubicacion === ubicacionSeleccionada)
                  .map((est, index) => (
                    <tr key={index}>
                      <td><FiMapPin className="me-1" />{est.ubicacion}</td>
                      {/* Usar la propiedad correcta: num_aires */}
                      <td>{est.num_aires ?? 'N/A'}</td>
                      <td>{est.temperatura_promedio?.toFixed(1) ?? 'N/A'} °C</td>
                      <td>{est.temperatura_min?.toFixed(1) ?? 'N/A'} °C</td>
                      <td>{est.temperatura_max?.toFixed(1) ?? 'N/A'} °C</td>
                      <td>{est.humedad_promedio?.toFixed(1) ?? 'N/A'} %</td>
                      <td>{est.humedad_min?.toFixed(1) ?? 'N/A'} %</td>
                      <td>{est.humedad_max?.toFixed(1) ?? 'N/A'} %</td>
                      <td>{est.lecturas_totales ?? 'N/A'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
          ) : (
            <div className="text-center p-5 text-muted">No hay datos de ubicaciones disponibles.</div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default EstadisticasPorUbicacion;
