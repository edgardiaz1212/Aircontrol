import React from 'react';
import { Card } from 'react-bootstrap';

const Estadisticas: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Estadísticas</h1>
      <Card className="dashboard-card">
        <Card.Body>
          <p>Esta sección mostrará gráficos y estadísticas detalladas sobre los datos de temperatura y humedad.</p>
          <p>Próximamente disponible.</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Estadisticas;