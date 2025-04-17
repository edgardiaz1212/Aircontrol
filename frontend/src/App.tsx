import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';

// Layouts
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// App Pages
import Dashboard from './pages/Dashboard';
import Aires from './pages/Aires';
import Lecturas from './pages/Lecturas';
import Estadisticas from './pages/Estadisticas';
import Mantenimientos from './pages/Mantenimientos';
import Umbrales from './pages/Umbrales';
import Usuarios from './pages/Usuarios';
import NotFound from './pages/NotFound';
import OtrosEquipos from './pages/OtrosEquipos';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Container } from 'react-bootstrap';

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar token y autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      // Si hay un token pero estamos en la página de login o register, redirigir al dashboard
      if (token && ['/login', '/register', '/'].includes(location.pathname)) {
        navigate('/aircontrol/dashboard');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  return (
    <AppContextProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="aires" element={<Aires />} />
            <Route path="lecturas" element={<Lecturas />} />
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="mantenimientos" element={<Mantenimientos />} />
            <Route path="umbrales" element={<Umbrales />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="/otros-equipos" element={<OtrosEquipos />} />
          </Route>
        </Route>

        {/* 404 - Página no encontrada */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppContextProvider>
  );
};

export default App;