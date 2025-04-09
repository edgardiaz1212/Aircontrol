import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Tab, Form, Spinner, Alert, Table } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import axios from 'axios';
import { 
  FiBarChart2, FiThermometer, FiDroplet, FiMapPin, FiClock, FiWind
} from 'react-icons/fi';

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface EstadisticasGenerales {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  total_lecturas: number;
  variacion_temperatura: number;
  variacion_humedad: number;
}

interface EstadisticasAire extends EstadisticasGenerales {
  aire_id: number;
  nombre: string;
  ubicacion: string;
}

interface EstadisticasUbicacion {
  ubicacion: string;
  aires: number;
  temperatura_promedio: number;
  humedad_promedio: number;
}

interface DatosGrafico {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }[];
}

const Estadisticas: React.FC = () => {
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [aireSeleccionado, setAireSeleccionado] = useState<number | null>(null);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | null>(null);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasAire, setEstadisticasAire] = useState<EstadisticasAire | null>(null);
  const [estadisticasUbicacion, setEstadisticasUbicacion] = useState<EstadisticasUbicacion[]>([]);
  const [graficosGenerales, setGraficosGenerales] = useState<{
    temperatura: DatosGrafico | null;
    humedad: DatosGrafico | null;
    comparativoTemp: DatosGrafico | null;
    comparativoHum: DatosGrafico | null;
  }>({
    temperatura: null,
    humedad: null,
    comparativoTemp: null,
    comparativoHum: null
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar aires y ubicaciones
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar aires
        const responseAires = await axios.get('/aires');
        setAires(responseAires.data);
        
        // Extraer ubicaciones únicas
        const ubicacionesUnicas = Array.from(
          new Set(responseAires.data.map((aire: AireAcondicionado) => aire.ubicacion))
        );
        setUbicaciones(ubicacionesUnicas as string[]);
        
        // Cargar estadísticas generales
        const responseEstadisticas = await axios.get('/estadisticas/general');
        setEstadisticasGenerales(responseEstadisticas.data);
        
        // Obtener estadísticas por ubicación
        const responseUbicaciones = await axios.get('/estadisticas/ubicacion');
        setEstadisticasUbicacion(responseUbicaciones.data);
        
        // Generar datos para gráficos
        // En un caso real, obtendríamos estos datos de la API
        generarDatosGraficoEjemplo();
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos de estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  // Cargar estadísticas por aire
  useEffect(() => {
    const fetchEstadisticasAire = async () => {
      if (!aireSeleccionado) {
        setEstadisticasAire(null);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/estadisticas/aire/${aireSeleccionado}`);
        
        // Añadir información del aire
        const aire = aires.find(a => a.id === aireSeleccionado);
        if (aire) {
          setEstadisticasAire({
            ...response.data,
            aire_id: aire.id,
            nombre: aire.nombre,
            ubicacion: aire.ubicacion
          });
        }
      } catch (error) {
        console.error('Error al cargar estadísticas del aire:', error);
        setError('Error al cargar estadísticas del aire seleccionado');
      } finally {
        setLoading(false);
      }
    };

    if (aireSeleccionado) {
      fetchEstadisticasAire();
    }
  }, [aireSeleccionado, aires]);

  // Generar datos de ejemplo para los gráficos
  const generarDatosGraficoEjemplo = () => {
    // Datos de ejemplo para gráfico de temperatura
    const graficoTemperatura: DatosGrafico = {
      labels: ['2 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '10 PM'],
      datasets: [
        {
          label: 'Temperatura °C',
          data: [21.5, 20.8, 22.3, 24.7, 25.2, 24.1, 22.5],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4
        }
      ]
    };
    
    // Datos de ejemplo para gráfico de humedad
    const graficoHumedad: DatosGrafico = {
      labels: ['2 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '10 PM'],
      datasets: [
        {
          label: 'Humedad %',
          data: [45, 47, 42, 38, 35, 40, 44],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4
        }
      ]
    };
    
    // Datos de ejemplo para gráfico comparativo de temperatura
    const graficoComparativoTemp: DatosGrafico = {
      labels: ['Sala Servidores', 'Oficina Central', 'Recepción', 'Sala Reuniones'],
      datasets: [
        {
          label: 'Temperatura Promedio °C',
          data: [22.5, 24.8, 23.7, 23.2],
          backgroundColor: 'rgba(255, 99, 132, 0.7)'
        }
      ]
    };
    
    // Datos de ejemplo para gráfico comparativo de humedad
    const graficoComparativoHum: DatosGrafico = {
      labels: ['Sala Servidores', 'Oficina Central', 'Recepción', 'Sala Reuniones'],
      datasets: [
        {
          label: 'Humedad Promedio %',
          data: [42, 38, 45, 40],
          backgroundColor: 'rgba(54, 162, 235, 0.7)'
        }
      ]
    };
    
    setGraficosGenerales({
      temperatura: graficoTemperatura,
      humedad: graficoHumedad,
      comparativoTemp: graficoComparativoTemp,
      comparativoHum: graficoComparativoHum
    });
  };

  // Opciones para gráficos de línea
  const opcionesLineaTemp: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Variación de Temperatura' }
    },
    scales: {
      y: {
        title: { display: true, text: 'Temperatura (°C)' }
      },
      x: {
        title: { display: true, text: 'Hora del día' }
      }
    }
  };
  
  const opcionesLineaHum: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Variación de Humedad' }
    },
    scales: {
      y: {
        title: { display: true, text: 'Humedad (%)' }
      },
      x: {
        title: { display: true, text: 'Hora del día' }
      }
    }
  };
  
  // Opciones para gráficos de barras
  const opcionesBarraTemp: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Comparativo de Temperatura por Ubicación' }
    },
    scales: {
      y: {
        title: { display: true, text: 'Temperatura (°C)' }
      }
    }
  };
  
  const opcionesBarraHum: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Comparativo de Humedad por Ubicación' }
    },
    scales: {
      y: {
        title: { display: true, text: 'Humedad (%)' }
      }
    }
  };

  return (
    <div>
      <h1 className="mb-4">Estadísticas</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading && !estadisticasGenerales ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando estadísticas...</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="general" className="mb-4">
          {/* Pestaña de Estadísticas Generales */}
          <Tab eventKey="general" title={<><FiBarChart2 className="me-2" /> General</>}>
            <Row>
              <Col lg={4} md={6} className="mb-4">
                <Card className="dashboard-card h-100">
                  <Card.Header>Resumen General</Card.Header>
                  <Card.Body>
                    {estadisticasGenerales ? (
                      <Table striped hover>
                        <tbody>
                          <tr>
                            <td><FiThermometer className="me-2 text-danger" />Temperatura Promedio</td>
                            <td><strong>{estadisticasGenerales.temperatura_promedio.toFixed(1)} °C</strong></td>
                          </tr>
                          <tr>
                            <td><FiThermometer className="me-2 text-danger" />Temperatura Máxima</td>
                            <td><strong>{estadisticasGenerales.temperatura_maxima.toFixed(1)} °C</strong></td>
                          </tr>
                          <tr>
                            <td><FiThermometer className="me-2 text-danger" />Temperatura Mínima</td>
                            <td><strong>{estadisticasGenerales.temperatura_minima.toFixed(1)} °C</strong></td>
                          </tr>
                          <tr>
                            <td><FiDroplet className="me-2 text-primary" />Humedad Promedio</td>
                            <td><strong>{estadisticasGenerales.humedad_promedio.toFixed(1)} %</strong></td>
                          </tr>
                          <tr>
                            <td><FiDroplet className="me-2 text-primary" />Humedad Máxima</td>
                            <td><strong>{estadisticasGenerales.humedad_maxima.toFixed(1)} %</strong></td>
                          </tr>
                          <tr>
                            <td><FiDroplet className="me-2 text-primary" />Humedad Mínima</td>
                            <td><strong>{estadisticasGenerales.humedad_minima.toFixed(1)} %</strong></td>
                          </tr>
                          <tr>
                            <td><FiClock className="me-2" />Total de Lecturas</td>
                            <td><strong>{estadisticasGenerales.total_lecturas}</strong></td>
                          </tr>
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No hay datos disponibles</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={8} md={6} className="mb-4">
                <Row>
                  <Col sm={12} className="mb-4">
                    <Card className="dashboard-card">
                      <Card.Header>Variación de Temperatura</Card.Header>
                      <Card.Body>
                        <div className="chart-container">
                          {graficosGenerales.temperatura ? (
                            <Line 
                              data={graficosGenerales.temperatura} 
                              options={opcionesLineaTemp} 
                            />
                          ) : (
                            <div className="text-center p-5">
                              <p>No hay datos suficientes para generar el gráfico</p>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col sm={12}>
                    <Card className="dashboard-card">
                      <Card.Header>Variación de Humedad</Card.Header>
                      <Card.Body>
                        <div className="chart-container">
                          {graficosGenerales.humedad ? (
                            <Line 
                              data={graficosGenerales.humedad} 
                              options={opcionesLineaHum} 
                            />
                          ) : (
                            <div className="text-center p-5">
                              <p>No hay datos suficientes para generar el gráfico</p>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
            
            <Row>
              <Col md={6} className="mb-4">
                <Card className="dashboard-card">
                  <Card.Header>Temperatura por Ubicación</Card.Header>
                  <Card.Body>
                    <div className="chart-container">
                      {graficosGenerales.comparativoTemp ? (
                        <Bar 
                          data={graficosGenerales.comparativoTemp} 
                          options={opcionesBarraTemp} 
                        />
                      ) : (
                        <div className="text-center p-5">
                          <p>No hay datos suficientes para generar el gráfico</p>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} className="mb-4">
                <Card className="dashboard-card">
                  <Card.Header>Humedad por Ubicación</Card.Header>
                  <Card.Body>
                    <div className="chart-container">
                      {graficosGenerales.comparativoHum ? (
                        <Bar 
                          data={graficosGenerales.comparativoHum} 
                          options={opcionesBarraHum} 
                        />
                      ) : (
                        <div className="text-center p-5">
                          <p>No hay datos suficientes para generar el gráfico</p>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
          
          {/* Pestaña de Estadísticas por Aire */}
          <Tab eventKey="aire" title={<><FiWind className="me-2" /> Por Aire</>}>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Seleccionar Aire Acondicionado</Form.Label>
                  <Form.Select 
                    value={aireSeleccionado || ''} 
                    onChange={e => setAireSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
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
            
            {loading && aireSeleccionado ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando estadísticas del aire...</p>
              </div>
            ) : aireSeleccionado && estadisticasAire ? (
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
                        <Table striped hover>
                          <tbody>
                            <tr>
                              <td><FiThermometer className="me-2 text-danger" />Temperatura Promedio</td>
                              <td><strong>{estadisticasAire.temperatura_promedio.toFixed(1)} °C</strong></td>
                            </tr>
                            <tr>
                              <td><FiThermometer className="me-2 text-danger" />Temperatura Máxima</td>
                              <td><strong>{estadisticasAire.temperatura_maxima.toFixed(1)} °C</strong></td>
                            </tr>
                            <tr>
                              <td><FiThermometer className="me-2 text-danger" />Temperatura Mínima</td>
                              <td><strong>{estadisticasAire.temperatura_minima.toFixed(1)} °C</strong></td>
                            </tr>
                            <tr>
                              <td><FiThermometer className="me-2 text-danger" />Variación de Temperatura</td>
                              <td><strong>±{estadisticasAire.variacion_temperatura.toFixed(2)} °C</strong></td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <Table striped hover>
                          <tbody>
                            <tr>
                              <td><FiDroplet className="me-2 text-primary" />Humedad Promedio</td>
                              <td><strong>{estadisticasAire.humedad_promedio.toFixed(1)} %</strong></td>
                            </tr>
                            <tr>
                              <td><FiDroplet className="me-2 text-primary" />Humedad Máxima</td>
                              <td><strong>{estadisticasAire.humedad_maxima.toFixed(1)} %</strong></td>
                            </tr>
                            <tr>
                              <td><FiDroplet className="me-2 text-primary" />Humedad Mínima</td>
                              <td><strong>{estadisticasAire.humedad_minima.toFixed(1)} %</strong></td>
                            </tr>
                            <tr>
                              <td><FiDroplet className="me-2 text-primary" />Variación de Humedad</td>
                              <td><strong>±{estadisticasAire.variacion_humedad.toFixed(2)} %</strong></td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
                
                <Row>
                  <Col md={6} className="mb-4">
                    <Card className="dashboard-card">
                      <Card.Header>Variación de Temperatura</Card.Header>
                      <Card.Body>
                        <div className="chart-container">
                          {graficosGenerales.temperatura ? (
                            <Line 
                              data={graficosGenerales.temperatura} 
                              options={opcionesLineaTemp} 
                            />
                          ) : (
                            <div className="text-center p-5">
                              <p>No hay datos suficientes para generar el gráfico</p>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6} className="mb-4">
                    <Card className="dashboard-card">
                      <Card.Header>Variación de Humedad</Card.Header>
                      <Card.Body>
                        <div className="chart-container">
                          {graficosGenerales.humedad ? (
                            <Line 
                              data={graficosGenerales.humedad} 
                              options={opcionesLineaHum} 
                            />
                          ) : (
                            <div className="text-center p-5">
                              <p>No hay datos suficientes para generar el gráfico</p>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            ) : (
              <Card className="dashboard-card">
                <Card.Body className="text-center p-5">
                  <FiWind size={50} className="text-muted mb-3" />
                  <h4>Seleccione un aire acondicionado para ver sus estadísticas</h4>
                </Card.Body>
              </Card>
            )}
          </Tab>
          
          {/* Pestaña de Estadísticas por Ubicación */}
          <Tab eventKey="ubicacion" title={<><FiMapPin className="me-2" /> Por Ubicación</>}>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Seleccionar Ubicación</Form.Label>
                  <Form.Select 
                    value={ubicacionSeleccionada || ''} 
                    onChange={e => setUbicacionSeleccionada(e.target.value || null)}
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
                {estadisticasUbicacion.length > 0 ? (
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Ubicación</th>
                        <th>Aires Acondicionados</th>
                        <th>Temperatura Promedio</th>
                        <th>Humedad Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadisticasUbicacion
                        .filter(e => !ubicacionSeleccionada || e.ubicacion === ubicacionSeleccionada)
                        .map((est, index) => (
                          <tr key={index}>
                            <td>{est.ubicacion}</td>
                            <td>{est.aires}</td>
                            <td>
                              <FiThermometer className="me-1 text-danger" />
                              {est.temperatura_promedio.toFixed(1)} °C
                            </td>
                            <td>
                              <FiDroplet className="me-1 text-primary" />
                              {est.humedad_promedio.toFixed(1)} %
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center p-5">
                    <p>No hay datos de ubicaciones disponibles</p>
                  </div>
                )}
              </Card.Body>
            </Card>
            
            {ubicacionSeleccionada && (
              <Row className="mt-4">
                <Col md={6} className="mb-4">
                  <Card className="dashboard-card">
                    <Card.Header>Comparativa de Temperatura</Card.Header>
                    <Card.Body>
                      <div className="chart-container">
                        {graficosGenerales.comparativoTemp ? (
                          <Bar 
                            data={graficosGenerales.comparativoTemp} 
                            options={opcionesBarraTemp} 
                          />
                        ) : (
                          <div className="text-center p-5">
                            <p>No hay datos suficientes para generar el gráfico</p>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6} className="mb-4">
                  <Card className="dashboard-card">
                    <Card.Header>Comparativa de Humedad</Card.Header>
                    <Card.Body>
                      <div className="chart-container">
                        {graficosGenerales.comparativoHum ? (
                          <Bar 
                            data={graficosGenerales.comparativoHum} 
                            options={opcionesBarraHum} 
                          />
                        ) : (
                          <div className="text-center p-5">
                            <p>No hay datos suficientes para generar el gráfico</p>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>
        </Tabs>
      )}
    </div>
  );
};

export default Estadisticas;