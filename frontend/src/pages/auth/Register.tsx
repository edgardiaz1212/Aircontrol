import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { FiUserPlus } from 'react-icons/fi';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [validated, setValidated] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { register, loading, error, clearError, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Limpiar error al montar el componente
    clearError();
    
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [clearError, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Verificar coincidencia de contraseñas
    if (name === 'password' || name === 'confirmPassword') {
      if (formData.confirmPassword && formData.password !== value && name === 'password') {
        setPasswordError('Las contraseñas no coinciden');
      } else if (name === 'confirmPassword' && formData.password !== value) {
        setPasswordError('Las contraseñas no coinciden');
      } else {
        setPasswordError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Validar formulario
    if (form.checkValidity() === false || passwordError) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    // Verificar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    // Enviar datos de registro
    const success = await register({
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      username: formData.username,
      password: formData.password
    });
    
    if (success) {
      navigate('/login', { state: { registroExitoso: true } });
    }
  };

  return (
    <Card className="auth-form shadow" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Card.Title className="text-center mb-4">
          <h2>Crear Cuenta</h2>
          <small className="text-muted">Sistema de Monitoreo AC</small>
        </Card.Title>
        
        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            {error}
          </Alert>
        )}
        
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formNombre">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese su nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Por favor ingrese su nombre.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formApellido">
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese su apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Por favor ingrese su apellido.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Ingrese su email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Por favor ingrese un email válido.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Nombre de usuario</Form.Label>
            <Form.Control
              type="text"
              placeholder="Elija un nombre de usuario"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Por favor elija un nombre de usuario.
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ingrese su contraseña"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  isInvalid={!!passwordError}
                />
                <Form.Control.Feedback type="invalid">
                  Por favor ingrese una contraseña.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formConfirmPassword">
                <Form.Label>Confirmar contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirme su contraseña"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  isInvalid={!!passwordError}
                />
                <Form.Control.Feedback type="invalid">
                  {passwordError || 'Por favor confirme su contraseña.'}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mt-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registrando...
              </>
            ) : (
              <>
                <FiUserPlus className="me-2" /> Crear Cuenta
              </>
            )}
          </Button>
        </Form>
        
        <div className="text-center mt-3">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Register;