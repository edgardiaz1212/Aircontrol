import React, { useState, useEffect, useCallback } from 'react';
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
  ChartOptions,
  ChartData // Import ChartData type
} from 'chart.js';
import api from '../services/api';
import {
  FiBarChart2, FiThermometer, FiDroplet, FiMapPin, FiClock, FiWind
} from 'react-icons/fi';
import { format } from 'date-fns'; // For formatting dates/times in charts

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

// --- Interfaces (mantener las existentes) ---
interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface Lectura {
  id: number;
  aire_id: number;
  fecha: string; // Assuming ISO string format from backend
  temperatura: number;
  humedad: number;
}

interface EstadisticasGenerales {
  temperatura_promedio: number;
  temperatura_maxima: number;
  temperatura_minima: number;
  humedad_promedio: number;
  humedad_maxima: number;
  humedad_minima: number;
  total_lecturas: number;
  // Assuming backend might not provide these directly in general stats
  variacion_temperatura?: number;
  variacion_humedad?: number;
}

interface EstadisticasAire extends EstadisticasGenerales {
  aire_id: number;
  nombre: string;
  ubicacion: string;
  // Explicitly add variations if backend provides them per aire
  variacion_temperatura: number;
  variacion_humedad: number;
}

interface EstadisticasUbicacion {
  ubicacion: string;
  aires: number; // Assuming backend provides this count
  temperatura_promedio: number;
  humedad_promedio: number;
}

// Renamed for clarity
interface ChartDataType {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }[];
}

// --- Componente Estadisticas ---
const Estadisticas: React.FC = () => {
  // --- State ---
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [aireSeleccionado, setAireSeleccionado] = useState<number | null>(null);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | null>(null);

  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null);
  const [estadisticasAire, setEstadisticasAire] = useState<EstadisticasAire | null>(null);
  const [estadisticasUbicacion, setEstadisticasUbicacion] = useState<EstadisticasUbicacion[]>([]);

  // State for chart data
  const [graficoGeneralTemp, setGraficoGeneralTemp] = useState<ChartDataType | null>(null);
  const [graficoGeneralHum, setGraficoGeneralHum] = useState<ChartDataType | null>(null);
  const [graficoComparativoTemp, setGraficoComparativoTemp] = useState<ChartDataType | null>(null);
  const [graficoComparativoHum, setGraficoComparativoHum] = useState<ChartDataType | null>(null);
  const [graficoAireTemp, setGraficoAireTemp] = useState<ChartDataType | null>(null);
  const [graficoAireHum, setGraficoAireHum] = useState<ChartDataType | null>(null);

  // Loading and Error States
  const [loadingGeneral, setLoadingGeneral] = useState<boolean>(true);
  const [loadingAire, setLoadingAire] = useState<boolean>(false); // Only true when fetching specific aire data
  const [loadingUbicacion, setLoadingUbicacion] = useState<boolean>(true);
  const [loadingChartsGeneral, setLoadingChartsGeneral] = useState<boolean>(true);
  const [loadingChartsAire, setLoadingChartsAire] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Helper Function to process Lecturas for Line Charts ---
  const procesarLecturasParaGrafico = (lecturas: Lectura[]): { tempChart: ChartDataType, humChart: ChartDataType } | null => {
    if (!lecturas || lecturas.length === 0) {
      return null;
    }

    // Sort by date just in case
    const sortedLecturas = [...lecturas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Limit the number of points for clarity, e.g., last 50 or 100
    const limitedLecturas = sortedLecturas.slice(-50); // Show last 50 readings

    const labels = limitedLecturas.map(l => format(new Date(l.fecha), 'HH:mm')); // Format time
    const tempData = limitedLecturas.map(l => l.temperatura);
    const humData = limitedLecturas.map(l => l.humedad);

    const tempChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Temperatura °C',
        data: tempData,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1 // Less curve for real data potentially
      }]
    };

    const humChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Humedad %',
        data: humData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      }]
    };

    return { tempChart, humChart };
  };

  // --- Helper Function to process Ubicacion Stats for Bar Charts ---
   const procesarUbicacionesParaGrafico = (stats: EstadisticasUbicacion[]): { tempChart: ChartDataType, humChart: ChartDataType } | null => {
    if (!stats || stats.length === 0) {
      return null;
    }

    const labels = stats.map(s => s.ubicacion);
    const tempAvgData = stats.map(s => s.temperatura_promedio);
    const humAvgData = stats.map(s => s.humedad_promedio);

    const tempChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Temperatura Promedio °C',
        data: tempAvgData,
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      }]
    };

    const humChart: ChartDataType = {
      labels,
      datasets: [{
        label: 'Humedad Promedio %',
        data: humAvgData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)'
      }]
    };

    return { tempChart, humChart };
  };


  // --- Effects ---

  // Initial Load: Aires, General Stats, Ubicacion Stats, General Charts
  useEffect(() => {
    const fetchDatosIniciales = async () => {
      setLoadingGeneral(true);
      setLoadingUbicacion(true);
      setLoadingChartsGeneral(true);
      setError(null);

      try {
        // Fetch in parallel
        const [resAires, resEstGen, resEstUbic, resLecturasGen] = await Promise.all([
          api.get('/aires'),
          api.get('/estadisticas/general'),
          api.get('/estadisticas/ubicacion'),
          api.get('/lecturas?limit=50') // Fetch last 50 readings for general chart
        ]);

        // Process Aires
        const airesData = resAires.data || []; // Adjust based on actual backend response structure for aires
        setAires(airesData);
        const ubicacionesUnicas = Array.from(
          new Set(airesData.map((aire: AireAcondicionado) => aire.ubicacion))
        );
        setUbicaciones(ubicacionesUnicas as string[]);
        setLoadingGeneral(false); // Aires loaded

        // Process General Statistics (assuming direct data, no 'data' key)
        setEstadisticasGenerales(resEstGen.data || null);

        // Process Ubicacion Statistics (assuming direct data, no 'data' key)
        const ubicacionData = resEstUbic.data || [];
        setEstadisticasUbicacion(ubicacionData);
        setLoadingUbicacion(false); // Ubicaciones loaded

        // Process General Lecturas for Charts
        const lecturasGenerales = resLecturasGen.data?.data || []; // Assuming /lecturas uses 'data' key
        const generalChartData = procesarLecturasParaGrafico(lecturasGenerales);
        if (generalChartData) {
          setGraficoGeneralTemp(generalChartData.tempChart);
          setGraficoGeneralHum(generalChartData.humChart);
        } else {
          setGraficoGeneralTemp(null);
          setGraficoGeneralHum(null);
        }

         // Process Ubicacion Stats for Bar Charts
         const comparativoChartData = procesarUbicacionesParaGrafico(ubicacionData);
         if (comparativoChartData) {
           setGraficoComparativoTemp(comparativoChartData.tempChart);
           setGraficoComparativoHum(comparativoChartData.humChart);
         } else {
           setGraficoComparativoTemp(null);
           setGraficoComparativoHum(null);
         }

        setLoadingChartsGeneral(false); // Charts loaded

      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar los datos iniciales de estadísticas.');
        // Set all loading states to false on error
        setLoadingGeneral(false);
        setLoadingUbicacion(false);
        setLoadingChartsGeneral(false);
      }
    };

    fetchDatosIniciales();
  }, []); // Empty dependency array means run once on mount

  // Load Statistics and Charts for Selected Aire
  useEffect(() => {
    const fetchDatosAire = async () => {
      if (!aireSeleccionado) {
        setEstadisticasAire(null);
        setGraficoAireTemp(null);
        setGraficoAireHum(null);
        return;
      }

      setLoadingAire(true);
      setLoadingChartsAire(true);
      setError(null);
      setEstadisticasAire(null); // Clear previous data
      setGraficoAireTemp(null);
      setGraficoAireHum(null);


      try {
        // Fetch stats and readings in parallel
         const [resStatsAire, resLecturasAire] = await Promise.all([
            api.get(`/estadisticas/aire/${aireSeleccionado}`),
            api.get(`/lecturas?aire_id=${aireSeleccionado}&limit=50`) // Fetch last 50 for this AC
         ]);


        // Process Stats (assuming direct data)
        const statsData = resStatsAire.data || {};
        const aireInfo = aires.find(a => a.id === aireSeleccionado); // Get name/location from already loaded aires
        if (aireInfo) {
          setEstadisticasAire({
            ...statsData,
            aire_id: aireInfo.id,
            nombre: aireInfo.nombre,
            ubicacion: aireInfo.ubicacion
          });
        } else {
           setEstadisticasAire(statsData); // Fallback if aireInfo not found
        }
        setLoadingAire(false);

        // Process Lecturas for Charts
        const lecturasAireData = resLecturasAire.data?.data || []; // Assuming /lecturas uses 'data' key
        const aireChartData = procesarLecturasParaGrafico(lecturasAireData);
         if (aireChartData) {
           setGraficoAireTemp(aireChartData.tempChart);
           setGraficoAireHum(aireChartData.humChart);
         } else {
           setGraficoAireTemp(null);
           setGraficoAireHum(null);
         }
        setLoadingChartsAire(false);

      } catch (err) {
        console.error('Error al cargar estadísticas del aire:', err);
        setError(`Error al cargar datos para el aire seleccionado (ID: ${aireSeleccionado}).`);
        setLoadingAire(false);
        setLoadingChartsAire(false);
      }
    };

    fetchDatosAire();
  }, [aireSeleccionado, aires]); // Re-run when aireSeleccionado changes (or aires list updates)


  // --- Chart Options (mantener las existentes) ---
  const opcionesLinea: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to shrink
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, /* Text set dynamically below */ }
    },
    scales: {
      y: {
        title: { display: true, /* Text set dynamically below */ }
      },
      x: {
        title: { display: true, text: 'Hora (HH:mm)' } // Updated label
      }
    }
  };

  const opcionesBarra: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to shrink
    indexAxis: 'x', // Use 'x' for vertical bars based on location labels
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, /* Text set dynamically below */ }
    },
    scales: {
      y: {
        beginAtZero: true, // Start y-axis at 0
        title: { display: true, /* Text set dynamically below */ }
      },
      x: {
         title: { display: true, text: 'Ubicación' }
      }
    }
  };

  // --- Render Helper for Charts ---
  const renderLineChart = (
    title: string,
    yAxisLabel: string,
    data: ChartDataType | null,
    loading: boolean
  ) => {
    const options: ChartOptions<'line'> = {
      ...opcionesLinea,
      plugins: {
        ...opcionesLinea.plugins,
        title: { ...opcionesLinea.plugins?.title, display: true, text: title }
      },
      scales: {
        ...opcionesLinea.scales,
        y: { ...opcionesLinea.scales?.y, title: { display: true, text: yAxisLabel } }
      }
    };
    return (
      <div className="chart-container" style={{ height: '300px', position: 'relative' }}> {/* Set fixed height */}
        {loading ? (
          <div className="text-center p-5"><Spinner animation="border" size="sm" /> Cargando gráfico...</div>
        ) : data ? (
          <Line data={data} options={options} />
        ) : (
          <div className="text-center p-5">No hay datos suficientes para generar el gráfico.</div>
        )}
      </div>
    );
  };

  const renderBarChart = (
    title: string,
    yAxisLabel: string,
    data: ChartDataType | null,
    loading: boolean
  ) => {
     const options: ChartOptions<'bar'> = {
      ...opcionesBarra,
      plugins: {
        ...opcionesBarra.plugins,
        title: { ...opcionesBarra.plugins?.title, display: true, text: title }
      },
      scales: {
        ...opcionesBarra.scales,
        y: { ...opcionesBarra.scales?.y, title: { display: true, text: yAxisLabel } }
      }
    };
    return (
      <div className="chart-container" style={{ height: '300px', position: 'relative' }}> {/* Set fixed height */}
        {loading ? (
          <div className="text-center p-5"><Spinner animation="border" size="sm" /> Cargando gráfico...</div>
        ) : data ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="text-center p-5">No hay datos suficientes para generar el gráfico.</div>
        )}
      </div>
    );
  };


  // --- JSX ---
  return (
    <div>
      <h1 className="mb-4">Estadísticas</h1>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Loading Indicator */}
      {loadingGeneral && loadingUbicacion && (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos iniciales...</p>
        </div>
      )}

      {/* Show Tabs only after initial data (aires, ubicaciones) is loaded */}
      {!loadingGeneral && !loadingUbicacion && (
        <Tabs defaultActiveKey="general" id="stats-tabs" className="mb-4">
          {/* Pestaña General */}
          <Tab eventKey="general" title={<><FiBarChart2 className="me-2" /> General</>}>
            <Row>
              {/* Resumen General Card */}
              <Col lg={4} md={6} className="mb-4">
                <Card className="dashboard-card h-100">
                  <Card.Header>Resumen General</Card.Header>
                  <Card.Body>
                    {loadingGeneral ? (
                       <div className="text-center"><Spinner animation="border" size="sm" /></div>
                    ) : estadisticasGenerales ? (
                      <Table striped hover size="sm">
                        <tbody>
                          <tr>
                            <td><FiThermometer className="me-2 text-danger" />Temp. Promedio</td>
                            <td><strong>{estadisticasGenerales.temperatura_promedio?.toFixed(1) ?? 'N/A'} °C</strong></td>
                          </tr>
                          <tr>
                            <td><FiThermometer className="me-2 text-danger" />Temp. Máxima</td>
                            <td><strong>{estadisticasGenerales.temperatura_maxima?.toFixed(1) ?? 'N/A'} °C</strong></td>
                          </tr>
                          <tr>
                            <td><FiThermometer className="me-2 text-danger" />Temp. Mínima</td>
                            <td><strong>{estadisticasGenerales.temperatura_minima?.toFixed(1) ?? 'N/A'} °C</strong></td>
                          </tr>
                          <tr>
                            <td><FiDroplet className="me-2 text-primary" />Hum. Promedio</td>
                            <td><strong>{estadisticasGenerales.humedad_promedio?.toFixed(1) ?? 'N/A'} %</strong></td>
                          </tr>
                          <tr>
                            <td><FiDroplet className="me-2 text-primary" />Hum. Máxima</td>
                            <td><strong>{estadisticasGenerales.humedad_maxima?.toFixed(1) ?? 'N/A'} %</strong></td>
                          </tr>
                          <tr>
                            <td><FiDroplet className="me-2 text-primary" />Hum. Mínima</td>
                            <td><strong>{estadisticasGenerales.humedad_minima?.toFixed(1) ?? 'N/A'} %</strong></td>
                          </tr>
                          <tr>
                            <td><FiClock className="me-2" />Total Lecturas</td>
                            <td><strong>{estadisticasGenerales.total_lecturas ?? 'N/A'}</strong></td>
                          </tr>
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted">No hay datos de resumen disponibles.</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* General Charts Column */}
              <Col lg={8} md={6} className="mb-4">
                <Row>
                  <Col sm={12} className="mb-4">
                    <Card className="dashboard-card">
                      <Card.Header>Variación General de Temperatura (Últimas lecturas)</Card.Header>
                      <Card.Body>
                        {renderLineChart(
                          'Variación General de Temperatura',
                          'Temperatura (°C)',
                          graficoGeneralTemp,
                          loadingChartsGeneral
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col sm={12}>
                    <Card className="dashboard-card">
                      <Card.Header>Variación General de Humedad (Últimas lecturas)</Card.Header>
                      <Card.Body>
                         {renderLineChart(
                          'Variación General de Humedad',
                          'Humedad (%)',
                          graficoGeneralHum,
                          loadingChartsGeneral
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Comparative Charts Row */}
            <Row>
              <Col md={6} className="mb-4">
                <Card className="dashboard-card">
                  <Card.Header>Temperatura Promedio por Ubicación</Card.Header>
                  <Card.Body>
                     {renderBarChart(
                        'Temperatura Promedio por Ubicación',
                        'Temperatura (°C)',
                        graficoComparativoTemp,
                        loadingUbicacion // Use ubicacion loading state
                      )}
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-4">
                <Card className="dashboard-card">
                  <Card.Header>Humedad Promedio por Ubicación</Card.Header>
                  <Card.Body>
                     {renderBarChart(
                        'Humedad Promedio por Ubicación',
                        'Humedad (%)',
                        graficoComparativoHum,
                        loadingUbicacion // Use ubicacion loading state
                      )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>

          {/* Pestaña Por Aire */}
          <Tab eventKey="aire" title={<><FiWind className="me-2" /> Por Aire</>}>
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
                    <Card className="dashboard-card">
                      <Card.Header>Variación Temperatura (Últimas lecturas)</Card.Header>
                      <Card.Body>
                         {renderLineChart(
                            `Variación Temperatura - ${estadisticasAire.nombre}`,
                            'Temperatura (°C)',
                            graficoAireTemp,
                            loadingChartsAire
                          )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-4">
                    <Card className="dashboard-card">
                      <Card.Header>Variación Humedad (Últimas lecturas)</Card.Header>
                      <Card.Body>
                         {renderLineChart(
                            `Variación Humedad - ${estadisticasAire.nombre}`,
                            'Humedad (%)',
                            graficoAireHum,
                            loadingChartsAire
                          )}
                      </Card.Body>
                    </Card>
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
          </Tab>

          {/* Pestaña Por Ubicación */}
          <Tab eventKey="ubicacion" title={<><FiMapPin className="me-2" /> Por Ubicación</>}>
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

            {/* Optionally, show comparative charts again here, maybe filtered if needed */}
            {/* For now, the main comparative charts are in the General tab */}
            {/* If you wanted charts specific to the *selected* location, you'd add them here */}

          </Tab>
        </Tabs>
      )}
    </div>
  );
};

export default Estadisticas;
