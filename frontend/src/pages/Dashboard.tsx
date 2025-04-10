import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert } from 'react-bootstrap';
// Assuming your api instance is correctly set up to include the auth header
import api from '../services/api'; // Make sure this path is correct
import { FiWind, FiThermometer, FiDroplet, FiTool, FiAlertTriangle } from 'react-icons/fi';

// Keep the ResumenData interface as is
interface ResumenData {
  totalAires: number;
  totalLecturas: number;
  totalMantenimientos: number;
  alertas: number;
  ultimasLecturas: any[]; // Consider defining a specific type for Lectura
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenData | null>(null); // Initialize as null

  useEffect(() => {
    const cargarResumen = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Make the actual API call ---
        const response = await api.get<ResumenData>('/dashboard/resumen'); // Use your api instance
        setResumen(response.data); // Set the data received from the backend
        // --- End API call ---

      } catch (err: any) { // Catch potential errors from the API call
        console.error('Error al cargar resumen:', err);
        // Provide more specific error messages if possible
        if (err.response?.status === 401) {
          setError('No autorizado. Por favor, inicia sesión de nuevo.');
          // Optionally, trigger logout here using useAppContext if needed
        } else {
          setError(err.response?.data?.mensaje || 'Error al cargar los datos del resumen.');
        }
        setResumen(null); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    cargarResumen();
  }, []); // Empty dependency array means this runs once on mount

  // --- Render Logic ---
  // Handle loading state
  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando Dashboard...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div>
        <h1 className="mb-4">Dashboard</h1>
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  // Handle case where data hasn't loaded (should be covered by loading/error, but good practice)
  if (!resumen) {
     return (
       <div>
         <h1 className="mb-4">Dashboard</h1>
         <Alert variant="warning">No se pudieron cargar los datos del resumen.</Alert>
       </div>
     );
  }

  // --- Render Dashboard Content (only if loading is false, error is null, and resumen is not null) ---
  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="dashboard-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {/* Use data from state */}
                  <h3 className="mb-0">{resumen.totalAires}</h3>
                  <small className="text-muted">Aires Acondicionados</small>
                </div>
                <FiWind size={40} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* ... other summary cards using resumen.totalLecturas, resumen.totalMantenimientos, resumen.alertas ... */}
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
           {/* Check if there are readings */}
           {resumen.ultimasLecturas && resumen.ultimasLecturas.length > 0 ? (
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
                   {/* Map over actual data */}
                   {resumen.ultimasLecturas.map((lectura) => (
                     <tr key={lectura.id}>
                       {/* Adjust property names if needed based on your API response */}
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
           ) : (
             <p className="text-center text-muted">No hay lecturas recientes para mostrar.</p>
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
