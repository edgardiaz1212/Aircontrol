import React from 'react';
import { Card } from 'react-bootstrap';

const Mantenimientos: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Mantenimientos</h1>
      <Card className="dashboard-card">
        <Card.Body>
          <p>Esta sección permitirá gestionar los registros de mantenimiento de los aires acondicionados.</p>
          <p>Próximamente disponible.</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Mantenimientos;