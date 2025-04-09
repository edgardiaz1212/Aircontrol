import React from 'react';
import { Card } from 'react-bootstrap';

const Aires: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Aires Acondicionados</h1>
      <Card className="dashboard-card">
        <Card.Body>
          <p>Esta sección permitirá gestionar los aires acondicionados del sistema.</p>
          <p>Próximamente disponible.</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Aires;