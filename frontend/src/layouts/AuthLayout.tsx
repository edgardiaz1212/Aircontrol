import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAppContext } from '../context/AppContext';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAppContext();

  // Si el usuario está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Container fluid className="p-0">
      <div className="auth-layout d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f5f8fa' }}>
        <Outlet />
      </div>
    </Container>
  );
};

export default AuthLayout;