import React from 'react';
import { Card } from 'react-bootstrap';

const Lecturas: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Lecturas</h1>
      <Card className="dashboard-card">
        <Card.Body>
          <p>Esta sección permitirá visualizar y gestionar las lecturas de temperatura y humedad de los aires acondicionados.</p>
          <p>Próximamente disponible.</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Lecturas;