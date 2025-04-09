import React from 'react';
import { Card } from 'react-bootstrap';

const Usuarios: React.FC = () => {
  return (
    <div>
      <h1 className="mb-4">Gestión de Usuarios</h1>
      <Card className="dashboard-card">
        <Card.Body>
          <p>Esta sección permitirá administrar los usuarios del sistema, asignando diferentes roles y permisos.</p>
          <p>Próximamente disponible.</p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Usuarios;