import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FiEdit, FiCheckCircle, FiUserX, FiUser, FiUsers, FiMail, FiCalendar, FiClock, FiShield, FiCheck, FiX, FiPlus } from 'react-icons/fi'; // <-- Added FiPlus
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

// Interface for new user data (includes password)
interface NewUserData {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
  rol: string;
}

const Usuarios: React.FC = () => {
  const { user, register: registerUser } = useAppContext(); // <-- Get register function from context
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false); // Renamed for clarity
  const [showAddModal, setShowAddModal] = useState<boolean>(false); // <-- State for Add Modal
  const [editFormData, setEditFormData] = useState<Partial<Usuario>>({ // Renamed for clarity
    nombre: '',
    apellido: '',
    email: '',
    rol: 'operador',
    activo: true
  });
  const [newUserData, setNewUserData] = useState<NewUserData>({ // <-- State for New User Form
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    password: '',
    rol: 'operador' // Default role for new users
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Verificar si el usuario es administrador
  const isAdmin = user?.rol === 'admin';
  // Check if user can add (Admin or Supervisor) - Although only Admin sees this page currently
  const canAdd = user?.rol === 'admin' || user?.rol === 'supervisor';

  // Function to fetch users (made reusable)
  const fetchUsuarios = async () => {
    if (!isAdmin) return; // Only admins can view the list

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/usuarios');
      // Ensure response.data is an array before setting state
      if (Array.isArray(response.data)) {
        setUsuarios(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        // Handle cases where data might be nested like { data: [...] }
        setUsuarios(response.data.data);
      } else {
        console.error('Unexpected response format for /usuarios:', response.data);
        setUsuarios([]); // Set to empty array if format is wrong
        setError('Formato de respuesta inesperado del servidor.');
      }
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      // More specific error handling based on status code
      if (error.response?.status === 500) {
        setError('Error interno del servidor al cargar usuarios. Revise los logs del backend.');
      } else {
        setError('Error al cargar los usuarios.');
      }
      setUsuarios([]); // Clear users on error
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios on component mount or when isAdmin changes
  useEffect(() => {
    fetchUsuarios();
  }, [isAdmin]); // Dependency array includes isAdmin

  // Manejar cambios en el formulario de EDICIÓN
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setEditFormData({
        ...editFormData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  // Manejar cambios en el formulario de CREACIÓN
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewUserData({
      ...newUserData,
      [name]: value
    });
  };


  // Abrir modal para editar
  const handleEdit = (usuario: Usuario) => {
    setEditFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });
    setSelectedUserId(usuario.id);
    setShowEditModal(true); // Show edit modal
    setShowAddModal(false); // Hide add modal just in case
  };

  // Abrir modal para agregar
  const handleAddUser = () => {
    setNewUserData({ // Reset form
      nombre: '',
      apellido: '',
      email: '',
      username: '',
      password: '',
      rol: 'operador'
    });
    setShowAddModal(true); // Show add modal
    setShowEditModal(false); // Hide edit modal just in case
  };

  // Alternar estado activo
  const handleToggleActivo = async (id: number, activo: boolean) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    // Optimistic update
    const originalUsuarios = [...usuarios];
    setUsuarios(usuarios.map(u =>
      u.id === id ? { ...u, activo: !activo } : u
    ));

    try {
      // Prepare only the necessary data for the PUT request
      const updateData = { activo: !activo };
      await api.put(`/usuarios/${id}/estado`, updateData); // Assuming an endpoint specifically for state change

      // If successful, the optimistic update is kept.
      setError(null); // Clear previous errors

    } catch (error) {
      console.error('Error al actualizar estado de usuario:', error);
      setError('Error al actualizar el estado del usuario');
      // Revert optimistic update on error
      setUsuarios(originalUsuarios);
    }
  };

  // Enviar formulario de EDICIÓN
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    // Optimistic update
    const originalUsuarios = [...usuarios];
    setUsuarios(usuarios.map(u =>
      u.id === selectedUserId ? { ...u, ...editFormData } as Usuario : u
    ));
    setShowEditModal(false); // Close modal immediately

    try {
      await api.put(`/usuarios/${selectedUserId}`, editFormData);
      setError(null); // Clear previous errors
      // Optionally refetch users if backend modifies data (e.g., timestamps)
      // fetchUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setError('Error al actualizar la información del usuario');
      // Revert optimistic update on error
      setUsuarios(originalUsuarios);
      setShowEditModal(true); // Reopen modal on error? Or just show error message.
    }
  };

  // Enviar formulario de CREACIÓN
  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Use the register function from context which handles loading/error state
    const success = await registerUser(newUserData);

    if (success) {
      setShowAddModal(false);
      fetchUsuarios(); // Refetch the user list to include the new user with their ID
    } else {
      // Error state is handled by the context, but you could add specific logic here if needed
      console.error("Registration failed (handled by context)");
      // setError is likely already set by the context's register function
    }
  };


  // Formatear fecha
  const formatearFecha = (fechaStr: string | null | undefined): string => {
    if (!fechaStr) return 'N/A';
    try {
      const fecha = new Date(fechaStr);
      // Check if date is valid
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      return fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formatting date:", fechaStr, e);
      return 'Error fecha';
    }
  };

  // Obtener color de badge según rol
  const getRolBadgeColor = (rol: string) => {
    switch (rol?.toLowerCase()) { // Added safe navigation
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

  // --- Render Component ---
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Usuarios</h1>
        {/* Show Add button only if user has permission */}
        {canAdd && (
          <Button variant="primary" onClick={handleAddUser}>
            <FiPlus className="me-2" /> Agregar Usuario
          </Button>
        )}
      </div>

      {/* Display errors from context or local state */}
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
                  <li><strong>Supervisor:</strong> Puede gestionar aires acondicionados, lecturas, mantenimientos, umbrales y agregar nuevos usuarios (operadores).</li>
                  <li><strong>Operador:</strong> Solo puede registrar lecturas y ver información/estadísticas.</li>
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
          ) : usuarios.length === 0 && !error ? ( // Show only if no error
            <div className="text-center p-5">
              <FiUsers size={50} className="text-muted mb-3" />
              <h4>No hay usuarios registrados</h4>
              {canAdd && (
                 <Button variant="primary" className="mt-3" onClick={handleAddUser}>
                   <FiPlus className="me-2" /> Agregar Usuario
                 </Button>
              )}
            </div>
          ) : !error && usuarios.length > 0 ? ( // Show table only if no error and users exist
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
                    <tr key={usuario.id} className={!usuario.activo ? 'text-muted text-decoration-line-through' : ''}>
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
                          {usuario.rol?.charAt(0).toUpperCase() + usuario.rol?.slice(1)}
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
                        {formatearFecha(usuario.ultima_conexion)}
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
          ) : null /* Don't render table if error occurred */}
        </Card.Body>
      </Card>

      {/* Modal de EDICIÓN */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {/* Edit form fields (Nombre, Apellido, Email, Rol, Activo) */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={editFormData.nombre || ''}
                    onChange={handleEditChange}
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
                    value={editFormData.apellido || ''}
                    onChange={handleEditChange}
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
                value={editFormData.email || ''}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="rol"
                value={editFormData.rol || 'operador'}
                onChange={handleEditChange}
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
                checked={editFormData.activo ?? false} // Use nullish coalescing for default
                onChange={handleEditChange}
              />
              <Form.Text className="text-muted">
                Los usuarios inactivos no pueden iniciar sesión en el sistema.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de CREACIÓN */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNewUserSubmit}>
          <Modal.Body>
            {/* Add form fields (Nombre, Apellido, Email, Username, Password, Rol) */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={newUserData.nombre}
                    onChange={handleNewUserChange}
                    required
                    placeholder="Ingrese el nombre"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellido"
                    value={newUserData.apellido}
                    onChange={handleNewUserChange}
                    required
                    placeholder="Ingrese el apellido"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newUserData.email}
                onChange={handleNewUserChange}
                required
                placeholder="ejemplo@dominio.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nombre de Usuario</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={newUserData.username}
                onChange={handleNewUserChange}
                required
                placeholder="Elija un nombre de usuario"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={newUserData.password}
                onChange={handleNewUserChange}
                required
                placeholder="Ingrese una contraseña segura"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select
                name="rol"
                value={newUserData.rol}
                onChange={handleNewUserChange}
                required
              >
                {/* Only Admin can create other Admins/Supervisors */}
                {isAdmin && <option value="admin">Administrador</option>}
                {isAdmin && <option value="supervisor">Supervisor</option>}
                <option value="operador">Operador</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Seleccione el rol inicial para el nuevo usuario.
              </Form.Text>
            </Form.Group>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Crear Usuario
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
};

export default Usuarios;
