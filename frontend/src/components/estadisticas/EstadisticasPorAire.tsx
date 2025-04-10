import React, { useState } from 'react';
import { Card, Row, Col, Form, Spinner, Table } from 'react-bootstrap';
import { FiMapPin, FiThermometer, FiDroplet, FiWind } from 'react-icons/fi';
import { ChartDataType, AireAcondicionado } from '../../pages/Estadisticas'; // Import interfaces
import ChartContainer from './ChartContainer';

interface EstadisticasAire {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  variacion_temperatura: number;
  variacion_humedad: number;
  aire_id: number;
  nombre: string;
  ubicacion: string;
}

interface EstadisticasPorAireProps {
  aires: AireAcondicionado[];
  aireSeleccionado: number | null;
  setAireSeleccionado: (aireId: number | null) => void;
  estadisticasAire: EstadisticasAire | null;
  graficoAireTemp: ChartDataType | null;
  graficoAireHum: ChartDataType | null;
  loadingGeneral: boolean;
  loadingAire: boolean;
  loadingChartsAire: boolean;
}

const EstadisticasPorAire: React.FC<EstadisticasPorAireProps> = ({
  aires,
  aireSeleccionado,
  setAireSeleccionado,
  estadisticasAire,
  graficoAireTemp,
  graficoAireHum,
  loadingGeneral,
  loadingAire,
  loadingChartsAire
}) => {
  return (
    <div>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Seleccionar Aire Acondicionado</Form.Label>
            <Form.Select
              value={aireSeleccionado || ''}
              onChange={e => setAireSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
              disabled={loadingGeneral} // Disable while loading aires
            >
              <option value="">Seleccione un aire acondicionado</option>
              {aires.map(aire => (
                <option key={aire.id} value={aire.id}>
                  {aire.nombre} ({aire.ubicacion})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      {/* Loading indicator for specific AC data */}
      {loadingAire && (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando estadísticas del aire...</p>
        </div>
      )}
      {/* Content when AC is selected and not loading */}
      {!loadingAire && aireSeleccionado && estadisticasAire ? (
        <>
          <Card className="dashboard-card mb-4">
            <Card.Header>
              <h5 className="mb-0">{estadisticasAire.nombre}</h5>
              <small className="text-muted">
                <FiMapPin className="me-1" /> {estadisticasAire.ubicacion}
              </small>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Table striped hover size="sm">
                    <tbody>
                      <tr>
                        <td><FiThermometer className="me-2 text-danger" />Temp. Promedio</td>
                        <td><strong>{estadisticasAire.temperatura_promedio?.toFixed(1) ?? 'N/A'} °C</strong></td>
                      </tr>
                      <tr>
                        <td><FiThermometer className="me-2 text-danger" />Temp. Máxima</td>
                        <td><strong>{estadisticasAire.temperatura_maxima?.toFixed(1) ?? 'N/A'} °C</strong></td>
                      </tr>
                      <tr>
                        <td><FiThermometer className="me-2 text-danger" />Temp. Mínima</td>
                        <td><strong>{estadisticasAire.temperatura_minima?.toFixed(1) ?? 'N/A'} °C</strong></td>
                      </tr>
                      <tr>
                        <td><FiThermometer className="me-2 text-danger" />Variación Temp.</td>
                        <td><strong>±{estadisticasAire.variacion_temperatura?.toFixed(2) ?? 'N/A'} °C</strong></td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table striped hover size="sm">
                    <tbody>
                      <tr>
                        <td><FiDroplet className="me-2 text-primary" />Hum. Promedio</td>
                        <td><strong>{estadisticasAire.humedad_promedio?.toFixed(1) ?? 'N/A'} %</strong></td>
                      </tr>
                      <tr>
                        <td><FiDroplet className="me-2 text-primary" />Hum. Máxima</td>
                        <td><strong>{estadisticasAire.humedad_maxima?.toFixed(1) ?? 'N/A'} %</strong></td>
                      </tr>
                      <tr>
                        <td><FiDroplet className="me-2 text-primary" />Hum. Mínima</td>
                        <td><strong>{estadisticasAire.humedad_minima?.toFixed(1) ?? 'N/A'} %</strong></td>
                      </tr>
                      <tr>
                        <td><FiDroplet className="me-2 text-primary" />Variación Hum.</td>
                        <td><strong>±{estadisticasAire.variacion_humedad?.toFixed(2) ?? 'N/A'} %</strong></td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row>
            <Col md={6} className="mb-4">
               <ChartContainer
                  title={`Variación Temperatura - ${estadisticasAire.nombre}`}
                  yAxisLabel="Temperatura (°C)"
                  data={graficoAireTemp}
                  loading={loadingChartsAire}
                  type={'line'}
               />
            </Col>
            <Col md={6} className="mb-4">
               <ChartContainer
                  title={`Variación Humedad - ${estadisticasAire.nombre}`}
                  yAxisLabel="Humedad (%)"
                  data={graficoAireHum}
                  loading={loadingChartsAire}
                  type={'line'}
               />
            </Col>
          </Row>
        </>
      ) : !loadingAire && !aireSeleccionado ? (
        // Placeholder when no AC is selected
        <Card className="dashboard-card">
          <Card.Body className="text-center p-5">
            <FiWind size={50} className="text-muted mb-3" />
            <h4>Seleccione un aire acondicionado para ver sus estadísticas detalladas y gráficos.</h4>
          </Card.Body>
        </Card>
      ) : null /* Handles the case where AC is selected but data is null (e.g., error) */}
    </div>
  );
};

export default EstadisticasPorAire;
