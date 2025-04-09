import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound: React.FC = () => {
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="text-center">
        <Col>
          <h1 className="display-1 fw-bold">404</h1>
          <h2 className="mb-4">Página no encontrada</h2>
          <p className="mb-4">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <Button as={Link} to="/dashboard" variant="primary">
            <FiHome className="me-2" /> Volver al inicio
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;