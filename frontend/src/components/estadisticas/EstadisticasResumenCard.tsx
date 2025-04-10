import React from 'react';
import { Card, Table, Spinner } from 'react-bootstrap';
import { FiThermometer, FiDroplet, FiClock } from 'react-icons/fi';

// Define the interface for the general statistics data
interface EstadisticasGenerales {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  total_lecturas: number;
}

// Define the props for the component
interface EstadisticasResumenCardProps {
  estadisticas: EstadisticasGenerales | null;
  loading: boolean;
}

const EstadisticasResumenCard: React.FC<EstadisticasResumenCardProps> = ({
  estadisticas,
  loading
}) => {
  return (
    <Card className="dashboard-card h-100">
      <Card.Header>Resumen General</Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" size="sm" />
            <p className="mt-2">Cargando resumen...</p>
          </div>
        ) : estadisticas ? (
          <Table striped hover size="sm" className="mb-0">
            <tbody>
              <tr>
                <td><FiThermometer className="me-2 text-danger" />Temp. Promedio</td>
                <td><strong>{estadisticas.temperatura_promedio?.toFixed(1) ?? 'N/A'} °C</strong></td>
              </tr>
              <tr>
                <td><FiThermometer className="me-2 text-danger" />Temp. Máxima</td>
                <td><strong>{estadisticas.temperatura_maxima?.toFixed(1) ?? 'N/A'} °C</strong></td>
              </tr>
              <tr>
                <td><FiThermometer className="me-2 text-danger" />Temp. Mínima</td>
                <td><strong>{estadisticas.temperatura_minima?.toFixed(1) ?? 'N/A'} °C</strong></td>
              </tr>
              <tr>
                <td><FiDroplet className="me-2 text-primary" />Hum. Promedio</td>
                <td><strong>{estadisticas.humedad_promedio?.toFixed(1) ?? 'N/A'} %</strong></td>
              </tr>
              <tr>
                <td><FiDroplet className="me-2 text-primary" />Hum. Máxima</td>
                <td><strong>{estadisticas.humedad_maxima?.toFixed(1) ?? 'N/A'} %</strong></td>
              </tr>
              <tr>
                <td><FiDroplet className="me-2 text-primary" />Hum. Mínima</td>
                <td><strong>{estadisticas.humedad_minima?.toFixed(1) ?? 'N/A'} %</strong></td>
              </tr>
              <tr>
                <td><FiClock className="me-2" />Total Lecturas</td>
                <td><strong>{estadisticas.total_lecturas ?? 'N/A'}</strong></td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <p className="text-center text-muted p-5">No hay datos de resumen disponibles.</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default EstadisticasResumenCard;
