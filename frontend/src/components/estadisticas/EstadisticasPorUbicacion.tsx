import React from 'react';
import { Card, Row, Col, Form, Spinner, Table } from 'react-bootstrap';
import { FiMapPin, FiThermometer, FiDroplet } from 'react-icons/fi';

interface EstadisticasUbicacion {
  ubicacion: string;
  aires: number; // Assuming backend provides this count
  temperatura_promedio: number;
  humedad_promedio: number;
}

interface EstadisticasPorUbicacionProps {
  ubicaciones: string[];
  ubicacionSeleccionada: string | null;
  setUbicacionSeleccionada: (ubicacion: string | null) => void;
  estadisticasUbicacion: EstadisticasUbicacion[];
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
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filtrar por Ubicación</Form.Label>
            <Form.Select
              value={ubicacionSeleccionada || ''}
              onChange={e => setUbicacionSeleccionada(e.target.value || null)}
              disabled={loadingUbicacion} // Disable while loading
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
                  <th>Aires</th>
                  <th>Temp. Promedio</th>
                  <th>Hum. Promedio</th>
                </tr>
              </thead>
              <tbody>
                {estadisticasUbicacion
                  .filter(e => !ubicacionSeleccionada || e.ubicacion === ubicacionSeleccionada)
                  .map((est, index) => (
                    <tr key={index}>
                      <td>{est.ubicacion}</td>
                      <td>{est.aires ?? 'N/A'}</td> {/* Display count if available */}
                      <td>
                        <FiThermometer className="me-1 text-danger" />
                        {est.temperatura_promedio?.toFixed(1) ?? 'N/A'} °C
                      </td>
                      <td>
                        <FiDroplet className="me-1 text-primary" />
                        {est.humedad_promedio?.toFixed(1) ?? 'N/A'} %
                      </td>
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
