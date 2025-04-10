import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Spinner } from 'react-bootstrap'; // Import Spinner
import axios from 'axios'; // Asegúrate de que axios esté instalado y configurado
import { FiWind, FiThermometer, FiDroplet, FiTool, FiAlertTriangle } from 'react-icons/fi';

// Define una interfaz más específica para las últimas lecturas
interface UltimaLectura {
  id: number;
  aire_id: number;
  nombre: string; // Nombre del aire acondicionado
  ubicacion: string;
  temperatura: number;
  humedad: number;
  fecha: string; // Considera usar Date si necesitas manipular fechas
}

// Actualiza la interfaz ResumenData para usar UltimaLectura
interface ResumenData {
  totalAires: number;
  totalLecturas: number;
  totalMantenimientos: number;
  alertas: number;
  ultimasLecturas: UltimaLectura[]; // Usa la interfaz específica
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Inicializa con valores por defecto o null para indicar que no hay datos aún
  const [resumen, setResumen] = useState<ResumenData | null>(null);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        setLoading(true);
        setError(null);

        // --- INICIO: Reemplazo de datos de prueba con llamada a la API ---
        // Asegúrate de que la URL base de axios esté configurada o usa la URL completa
        // Reemplaza '/api/dashboard/resumen' con tu endpoint real
        const response = await axios.get<ResumenData>('/api/dashboard/resumen');

        // Verifica si la respuesta tiene datos
        if (response.data) {
          setResumen(response.data);
        } else {
          // Maneja el caso donde la API devuelve una respuesta vacía o inesperada
          setError('No se recibieron datos del resumen.');
          setResumen({ // Puedes establecer un estado vacío si prefieres
            totalAires: 0,
            totalLecturas: 0,
            totalMantenimientos: 0,
            alertas: 0,
            ultimasLecturas: []
          });
        }
        // --- FIN: Reemplazo ---

      } catch (err) {
        console.error('Error al cargar resumen:', err);
        // Intenta dar un mensaje de error más específico si es posible
        let errorMessage = 'Error al cargar los datos del resumen.';
        if (axios.isAxiosError(err) && err.response) {
          // Puedes personalizar el mensaje basado en el status code o la respuesta del error
          errorMessage += ` (Status: ${err.response.status})`;
        } else if (err instanceof Error) {
            errorMessage += `: ${err.message}`;
        }
        setError(errorMessage);
        // Asegúrate de tener un estado inicial o vacío en caso de error
        setResumen({
            totalAires: 0,
            totalLecturas: 0,
            totalMantenimientos: 0,
            alertas: 0,
            ultimasLecturas: []
          });
      } finally {
        // Asegúrate de que el loading se desactive siempre
        setLoading(false);
      }
    };

    cargarResumen();
  }, []); // El array vacío asegura que useEffect se ejecute solo una vez al montar

  // --- Renderizado condicional mejorado ---
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  // Muestra el error de forma prominente si ocurre
  if (error) {
    return (
      <div>
        <h1 className="mb-4">Dashboard</h1>
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  // Si no está cargando y no hay error, pero no hay datos (resumen es null o vacío)
  if (!resumen) {
     return (
      <div>
        <h1 className="mb-4">Dashboard</h1>
        <Alert variant="warning">No se encontraron datos para mostrar en el dashboard.</Alert>
      </div>
     )
  }
  // --- Fin Renderizado condicional ---


  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        {/* Columna Total Aires */}
        <Col md={3} className="mb-3 mb-md-0"> {/* Añade margen inferior en móviles */}
          <Card className="dashboard-card h-100 shadow-sm"> {/* Añade sombra ligera */}
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">{resumen.totalAires}</h3>
                <small className="text-muted">Aires Acondicionados</small>
              </div>
              <FiWind size={40} className="text-primary opacity-75" /> {/* Ajusta opacidad */}
            </Card.Body>
          </Card>
        </Col>
        {/* Columna Total Lecturas */}
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="dashboard-card h-100 shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">{resumen.totalLecturas}</h3>
                <small className="text-muted">Lecturas Registradas</small>
              </div>
              <FiThermometer size={40} className="text-success opacity-75" />
            </Card.Body>
          </Card>
        </Col>
        {/* Columna Total Mantenimientos */}
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="dashboard-card h-100 shadow-sm">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">{resumen.totalMantenimientos}</h3>
                <small className="text-muted">Mantenimientos</small>
              </div>
              <FiTool size={40} className="text-info opacity-75" />
            </Card.Body>
          </Card>
        </Col>
        {/* Columna Alertas Activas */}
        <Col md={3}>
          <Card className={`dashboard-card h-100 shadow-sm ${resumen.alertas > 0 ? 'border-warning' : ''}`}> {/* Resalta si hay alertas */}
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className={`mb-0 ${resumen.alertas > 0 ? 'text-warning' : ''}`}>{resumen.alertas}</h3>
                <small className="text-muted">Alertas Activas</small>
              </div>
              <FiAlertTriangle size={40} className={`${resumen.alertas > 0 ? 'text-warning' : 'text-muted opacity-75'}`} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Últimas lecturas */}
      <Card className="dashboard-card mb-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Últimas Lecturas</h5>
        </Card.Header>
        <Card.Body>
          {/* No necesitas el chequeo de loading aquí porque ya se maneja arriba */}
          {resumen.ultimasLecturas && resumen.ultimasLecturas.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0"> {/* Quita margen inferior */}
                <thead className="table-light"> {/* Estilo ligero para header */}
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
                        {lectura.temperatura.toFixed(1)} °C {/* Formatea a 1 decimal */}
                      </td>
                      <td>
                        <FiDroplet className="me-1 text-primary" />
                        {lectura.humedad.toFixed(0)} % {/* Formatea a entero */}
                      </td>
                      {/* Considera formatear la fecha para mejor legibilidad */}
                      <td>{new Date(lectura.fecha).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-3 text-muted">
              No hay lecturas recientes para mostrar.
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Mensaje informativo (opcional, puedes quitarlo si ya no es necesario) */}
      {/*
      <Alert variant="info">
        <Alert.Heading>Información</Alert.Heading>
        <p>
          Este es el resumen general del sistema de monitoreo de aires acondicionados.
          Utilice la barra lateral para navegar a las diferentes secciones y obtener
          información más detallada.
        </p>
      </Alert>
      */}
    </div>
  );
};

export default Dashboard;
