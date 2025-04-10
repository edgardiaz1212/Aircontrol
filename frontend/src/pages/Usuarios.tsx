import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiEdit, FiCheckCircle, FiUserX, FiUser, FiUsers, FiMail, FiCalendar, FiClock, FiShield, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultima_conexion?: string;
}

const Usuarios: React.FC = () => {
  const { user } = useAppContext();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Usuario>>({
    nombre: '',
    apellido: '',
    email: '',
    rol: 'operador',
    activo: true
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Verificar si el usuario es administrador
  const isAdmin = user?.rol === 'admin';
  
  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setError('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [isAdmin]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Abrir modal para editar
  const handleEdit = (usuario: Usuario) => {
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });
    setSelectedUserId(usuario.id);
    setShowModal(true);
  };

  // Alternar estado activo
  const handleToggleActivo = async (id: number, activo: boolean) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    try {
      await api.put(`/usuarios/${id}`, {
        ...usuario,
        activo: !activo
      });
      
      setUsuarios(usuarios.map(u => 
        u.id === id ? { ...u, activo: !activo } : u
      ));
    } catch (error) {
      console.error('Error al actualizar estado de usuario:', error);
      setError('Error al actualizar el estado del usuario');
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) return;
    
    try {
      await api.put(`/usuarios/${selectedUserId}`, formData);
      
      setUsuarios(usuarios.map(u => 
        u.id === selectedUserId ? { ...u, ...formData } : u
      ));
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setError('Error al actualizar la información del usuario');
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Obtener color de badge según rol
  const getRolBadgeColor = (rol: string) => {
    switch (rol.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'supervisor':
        return 'warning';
      case 'operador':
        return 'info';
      default:
        return 'secondary';
    }
  };

  // Si no es administrador, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <div>
        <h1 className="mb-4">Gestión de Usuarios</h1>
        <Alert variant="warning">
          <Alert.Heading>Acceso Restringido</Alert.Heading>
          <p>
            Lo sentimos, solo los administradores pueden acceder a esta sección.
            Si necesita administrar usuarios, póngase en contacto con un administrador del sistema.
          </p>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Gestión de Usuarios</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="dashboard-card mb-4">
        <Card.Header>
          <h5 className="mb-0">Información</h5>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <div className="d-flex align-items-center">
              <FiUsers size={30} className="me-3" />
              <div>
                <h5 className="mb-1">Roles de Usuario</h5>
                <ul className="mb-0">
                  <li><strong>Administrador:</strong> Acceso completo al sistema, incluida la gestión de usuarios.</li>
                  <li><strong>Supervisor:</strong> Puede gestionar aires acondicionados, lecturas, mantenimientos y umbrales.</li>
                  <li><strong>Operador:</strong> Solo puede registrar lecturas y ver estadísticas.</li>
                </ul>
              </div>
            </div>
          </Alert>
        </Card.Body>
      </Card>
      
      <Card className="dashboard-card">
        <Card.Header>
          <h5 className="mb-0">Lista de Usuarios</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando usuarios...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center p-5">
              <FiUsers size={50} className="text-muted mb-3" />
              <h4>No hay usuarios registrados</h4>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Nombre Completo</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Última Conexión</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario.id} className={!usuario.activo ? 'text-muted' : ''}>
                      <td>{usuario.id}</td>
                      <td>
                        <FiUser className="me-1" />
                        {usuario.username}
                      </td>
                      <td>{usuario.nombre} {usuario.apellido}</td>
                      <td>
                        <FiMail className="me-1" />
                        {usuario.email}
                      </td>
                      <td>
                        <Badge bg={getRolBadgeColor(usuario.rol)}>
                          <FiShield className="me-1" />
                          {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        {usuario.activo ? (
                          <Badge bg="success">
                            <FiCheck className="me-1" /> Activo
                          </Badge>
                        ) : (
                          <Badge bg="secondary">
                            <FiX className="me-1" /> Inactivo
                          </Badge>
                        )}
                      </td>
                      <td>
                        <FiCalendar className="me-1" />
                        {formatearFecha(usuario.fecha_registro).split(' ')[0]}
                      </td>
                      <td>
                        <FiClock className="me-1" />
                        {usuario.ultima_conexion ? formatearFecha(usuario.ultima_conexion) : 'Nunca'}
                      </td>
                      <td className="text-end">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEdit(usuario)}
                          disabled={usuario.id === user?.id} // No permitir editarse a sí mismo
                          title={usuario.id === user?.id ? 'No puede editar su propio usuario' : 'Editar usuario'}
                        >
                          <FiEdit />
                        </Button>
                        <Button 
                          variant={usuario.activo ? 'outline-danger' : 'outline-success'} 
                          size="sm"
                          onClick={() => handleToggleActivo(usuario.id, usuario.activo)}
                          disabled={usuario.id === user?.id} // No permitir desactivarse a sí mismo
                          title={usuario.id === user?.id ? 'No puede cambiar el estado de su propio usuario' : 
                                 usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {usuario.activo ? <FiUserX /> : <FiCheckCircle />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de edición */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellido"
                    value={formData.apellido || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="rol"
                value={formData.rol || 'operador'}
                onChange={handleChange}
                required
              >
                <option value="admin">Administrador</option>
                <option value="supervisor">Supervisor</option>
                <option value="operador">Operador</option>
              </Form.Select>
              <Form.Text className="text-muted">
                El rol determina los permisos del usuario en el sistema.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Usuario activo"
                name="activo"
                checked={formData.activo || false}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Los usuarios inactivos no pueden iniciar sesión en el sistema.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Usuarios;