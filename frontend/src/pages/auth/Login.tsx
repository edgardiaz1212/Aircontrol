import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { FiLogIn } from 'react-icons/fi';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [validated, setValidated] = useState<boolean>(false);
  const { login, loading, error, clearError, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Limpiar error al montar el componente
    clearError();
    
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [clearError, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <Card className="auth-form shadow">
      <Card.Body>
        <Card.Title className="text-center mb-4">
          <h2>Iniciar Sesión</h2>
          <small className="text-muted">Sistema de Monitoreo AC</small>
        </Card.Title>
        
        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            {error}
          </Alert>
        )}
        
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Usuario</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese su nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Form.Control.Feedback type="invalid">
              Por favor ingrese su nombre de usuario.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Form.Control.Feedback type="invalid">
              Por favor ingrese su contraseña.
            </Form.Control.Feedback>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mt-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                <FiLogIn className="me-2" /> Iniciar Sesión
              </>
            )}
          </Button>
        </Form>
        
        <div className="text-center mt-3">
          <p>
            ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Login;