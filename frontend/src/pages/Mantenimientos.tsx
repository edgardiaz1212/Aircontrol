import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, Badge, Image } from 'react-bootstrap';
import { FiPlus, FiTrash2, FiFilter, FiTool, FiCalendar, FiInfo, FiUser, FiImage } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

interface Mantenimiento {
  id: number;
  aire_id: number;
  fecha: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
  imagen?: string;
  aire_nombre?: string;
  ubicacion?: string;
}

interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

const Mantenimientos: React.FC = () => {
  const { user } = useAppContext();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAire, setFiltroAire] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showImagenModal, setShowImagenModal] = useState<boolean>(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    aire_id: '',
    tipo_mantenimiento: '',
    descripcion: '',
    tecnico: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Verificar si el usuario puede agregar/eliminar mantenimientos
  const canEdit = user?.rol === 'admin' || user?.rol === 'supervisor';
  
  // Cargar aires y mantenimientos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar aires (CORREGIDO)
        const airesResponse = await api.get('/aires');
        // Accede directamente a .data, que es el array enviado por Flask
        const airesData = airesResponse.data || [];
        setAires(airesData);

        // Cargar mantenimientos (CORREGIDO)
        let url = '/mantenimientos';
        if (filtroAire) {
          url += `?aire_id=${filtroAire}`;
        }
        const mantenimientosResponse = await api.get(url);
        // Accede directamente a .data, que es el array enviado por Flask
        const mantenimientosData = mantenimientosResponse.data || [];

        // Añadir información del aire a cada mantenimiento
        // (Esta parte ya debería funcionar correctamente una vez que airesData tenga datos)
        const mantenimientosConDetalles = mantenimientosData.map((mantenimiento: Mantenimiento) => {
          const aire = airesData.find((a: AireAcondicionado) => a.id === mantenimiento.aire_id);
          return {
            ...mantenimiento,
            aire_nombre: aire?.nombre || 'Desconocido',
            ubicacion: aire?.ubicacion || 'Desconocida'
          };
        });

        setMantenimientos(mantenimientosConDetalles);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        // Considera mostrar un error más específico si es posible
        // Por ejemplo, verificar si error.response existe para errores de API
        setError('Error al cargar los datos. Verifique la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtroAire]);

  // Filtrar por aire
  const handleFiltrarPorAire = (aireId: number | null) => {
    setFiltroAire(aireId);
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Abrir modal para agregar
  const handleAdd = () => {
    setFormData({
      aire_id: aires.length > 0 ? aires[0].id.toString() : '',
      tipo_mantenimiento: '',
      descripcion: '',
      tecnico: ''
    });
    
    setShowModal(true);
  };

  // Eliminar mantenimiento
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este registro de mantenimiento?')) {
      try {
        await api.delete(`/mantenimientos/${id}`);
        setMantenimientos(mantenimientos.filter(m => m.id !== id));
      } catch (error) {
        console.error('Error al eliminar mantenimiento:', error);
        setError('Error al eliminar el registro de mantenimiento');
      }
    }
  };

  // Mostrar imagen en modal
  const handleShowImagen = (imagen: string) => {
    setImagenSeleccionada(imagen);
    setShowImagenModal(true);
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Crear FormData para enviar también la imagen si existe
      const formDataObj = new FormData();
      formDataObj.append('aire_id', formData.aire_id);
      formDataObj.append('tipo_mantenimiento', formData.tipo_mantenimiento);
      formDataObj.append('descripcion', formData.descripcion);
      formDataObj.append('tecnico', formData.tecnico);
      
      // Añadir imagen si se seleccionó
      if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
        formDataObj.append('imagen_file', fileInputRef.current.files[0]);
      }
      
      const response = await api.post('/mantenimientos', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Obtener aire correspondiente
      const aire = aires.find(a => a.id === parseInt(formData.aire_id));
      
      // Crear nuevo registro de mantenimiento
      const nuevoMantenimiento: Mantenimiento = {
        id: response.data.id,
        aire_id: parseInt(formData.aire_id),
        fecha: new Date().toISOString(),
        tipo_mantenimiento: formData.tipo_mantenimiento,
        descripcion: formData.descripcion,
        tecnico: formData.tecnico,
        aire_nombre: aire?.nombre || 'Desconocido',
        ubicacion: aire?.ubicacion || 'Desconocida'
      };
      
      setMantenimientos([...mantenimientos, nuevoMantenimiento]);
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar mantenimiento:', error);
      setError('Error al guardar el registro de mantenimiento');
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString();
  };

  // Obtener color de badge según tipo de mantenimiento
  const getBadgeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'preventivo':
        return 'success';
      case 'correctivo':
        return 'danger';
      case 'predictivo':
        return 'info';
      case 'instalación':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mantenimientos</h1>
        <div>
          <Form.Select 
            className="d-inline-block me-2"
            style={{ width: 'auto' }}
            value={filtroAire || ''}
            onChange={e => handleFiltrarPorAire(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Todos los aires</option>
            {aires.map(aire => (
              <option key={aire.id} value={aire.id}>
                {aire.nombre} - {aire.ubicacion}
              </option>
            ))}
          </Form.Select>
          
          {canEdit && (
            <Button variant="primary" onClick={handleAdd}>
              <FiPlus className="me-2" /> Registrar Mantenimiento
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="dashboard-card">
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando registros de mantenimiento...</p>
            </div>
          ) : mantenimientos.length === 0 ? (
            <div className="text-center p-5">
              <FiTool size={50} className="text-muted mb-3" />
              <h4>No hay registros de mantenimiento</h4>
              {canEdit && (
                <Button variant="primary" className="mt-3" onClick={handleAdd}>
                  <FiPlus className="me-2" /> Registrar mantenimiento
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Aire Acondicionado</th>
                    <th>Ubicación</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Técnico</th>
                    <th>Imagen</th>
                    {canEdit && <th className="text-end">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {mantenimientos.map(mantenimiento => (
                    <tr key={mantenimiento.id}>
                      <td>{mantenimiento.id}</td>
                      <td>{mantenimiento.aire_nombre}</td>
                      <td>{mantenimiento.ubicacion}</td>
                      <td>
                        <FiCalendar className="me-1" />
                        {formatearFecha(mantenimiento.fecha)}
                      </td>
                      <td>
                        <Badge bg={getBadgeColor(mantenimiento.tipo_mantenimiento)}>
                          {mantenimiento.tipo_mantenimiento}
                        </Badge>
                      </td>
                      <td>
                        <FiUser className="me-1" />
                        {mantenimiento.tecnico}
                      </td>
                      <td>
                        {mantenimiento.imagen ? (
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleShowImagen(mantenimiento.imagen!)}
                          >
                            <FiImage /> Ver
                          </Button>
                        ) : (
                          <span className="text-muted">Sin imagen</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="text-end">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(mantenimiento.id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal de formulario */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Registrar Mantenimiento</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Aire Acondicionado</Form.Label>
              <Form.Select
                name="aire_id"
                value={formData.aire_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un aire acondicionado</option>
                {aires.map(aire => (
                  <option key={aire.id} value={aire.id}>
                    {aire.nombre} - {aire.ubicacion}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Mantenimiento</Form.Label>
              <Form.Select
                name="tipo_mantenimiento"
                value={formData.tipo_mantenimiento}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un tipo</option>
                <option value="Preventivo">Preventivo</option>
                <option value="Correctivo">Correctivo</option>
                <option value="Predictivo">Predictivo</option>
                <option value="Instalación">Instalación</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Otros">Otros</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Técnico Responsable</Form.Label>
              <Form.Control
                type="text"
                name="tecnico"
                value={formData.tecnico}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Imagen (opcional)</Form.Label>
              <Form.Control
                type="file"
                ref={fileInputRef}
                accept="image/*"
              />
              <Form.Text className="text-muted">
                Suba una imagen relacionada al mantenimiento (max. 5MB)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Modal de imagen */}
      <Modal show={showImagenModal} onHide={() => setShowImagenModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Imagen de Mantenimiento</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {imagenSeleccionada && (
            <Image src={imagenSeleccionada} fluid />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImagenModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Mantenimientos;