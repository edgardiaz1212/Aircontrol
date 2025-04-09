import React from 'react';
import { Card } from 'react-bootstrap';

const Umbrales: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Umbrales</h1>
      <Card className="dashboard-card">
        <Card.Body>
          <p>Esta sección permitirá configurar los umbrales de temperatura y humedad para los distintos aires acondicionados.</p>
          <p>Próximamente disponible.</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Umbrales;