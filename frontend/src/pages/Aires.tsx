import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiWind } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
  fecha_instalacion: string;
}

const Aires: React.FC = () => {
  const { user } = useAppContext();
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [formData, setFormData] = useState<Partial<AireAcondicionado>>({
    nombre: '',
    ubicacion: '',
    fecha_instalacion: ''
  });
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Verificar si el usuario puede agregar/editar
  const canEdit = user?.rol === 'admin' || user?.rol === 'supervisor';

  // Cargar aires acondicionados
  useEffect(() => {
    const fetchAires = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/aires');
        setAires(response.data);
      } catch (error) {
        console.error('Error al cargar aires:', error);
        setError('Error al cargar los aires acondicionados');
      } finally {
        setLoading(false);
      }
    };

    fetchAires();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Abrir modal para agregar
  const handleAdd = () => {
    setFormData({
      nombre: '',
      ubicacion: '',
      fecha_instalacion: new Date().toISOString().split('T')[0]
    });
    setModalTitle('Agregar Aire Acondicionado');
    setFormMode('add');
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (aire: AireAcondicionado) => {
    setFormData(aire);
    setModalTitle('Editar Aire Acondicionado');
    setFormMode('edit');
    setShowModal(true);
  };

  // Eliminar aire
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este aire acondicionado?')) {
      try {
        await api.delete(`/aires/${id}`);
        setAires(aires.filter(aire => aire.id !== id));
      } catch (error) {
        console.error('Error al eliminar aire:', error);
        setError('Error al eliminar el aire acondicionado');
      }
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formMode === 'add') {
        const response = await api.post('/aires', formData);
        const nuevoAire = { ...formData, id: response.data.id } as AireAcondicionado;
        setAires([...aires, nuevoAire]);
      } else {
        await api.put(`/aires/${formData.id}`, formData);
        setAires(aires.map(aire => 
          aire.id === formData.id ? { ...aire, ...formData } as AireAcondicionado : aire
        ));
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      setError('Error al guardar el aire acondicionado');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Aires Acondicionados</h1>
        {canEdit && (
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Agregar
          </Button>
        )}
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
              <p className="mt-3">Cargando aires acondicionados...</p>
            </div>
          ) : aires.length === 0 ? (
            <div className="text-center p-5">
              <FiWind size={50} className="text-muted mb-3" />
              <h4>No hay aires acondicionados registrados</h4>
              {canEdit && (
                <Button variant="primary" className="mt-3" onClick={handleAdd}>
                  <FiPlus className="me-2" /> Agregar aire acondicionado
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Ubicación</th>
                    <th>Fecha de Instalación</th>
                    {canEdit && <th className="text-end">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {aires.map(aire => (
                    <tr key={aire.id}>
                      <td>{aire.id}</td>
                      <td>{aire.nombre}</td>
                      <td>{aire.ubicacion}</td>
                      <td>{aire.fecha_instalacion}</td>
                      {canEdit && (
                        <td className="text-end">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(aire)}
                          >
                            <FiEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(aire.id)}
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
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
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
            
            <Form.Group className="mb-3">
              <Form.Label>Ubicación</Form.Label>
              <Form.Control
                type="text"
                name="ubicacion"
                value={formData.ubicacion || ''}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Instalación</Form.Label>
              <Form.Control
                type="date"
                name="fecha_instalacion"
                value={formData.fecha_instalacion || ''}
                onChange={handleChange}
                required
              />
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
    </div>
  );
};

export default Aires;