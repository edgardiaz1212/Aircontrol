import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiSlash, FiBell, FiGlobe, FiWind, FiAlertTriangle, FiThermometer, FiDroplet } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

interface Umbral {
  id: number;
  nombre: string;
  es_global: boolean;
  aire_id?: number;
  temp_min: number;
  temp_max: number;
  hum_min: number;
  hum_max: number;
  notificar_activo: boolean;
  aire_nombre?: string;
  ubicacion?: string;
}

interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

const Umbrales: React.FC = () => {
  const { user } = useAppContext();
  const [umbrales, setUmbrales] = useState<Umbral[]>([]);
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Umbral>>({
    nombre: '',
    es_global: true,
    aire_id: undefined,
    temp_min: 18,
    temp_max: 25,
    hum_min: 30,
    hum_max: 70,
    notificar_activo: true
  });
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedUmbralId, setSelectedUmbralId] = useState<number | null>(null);

  // Verificar si el usuario puede agregar/editar umbrales
  const canEdit = user?.rol === 'admin' || user?.rol === 'supervisor';
  
  // Cargar aires y umbrales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar aires
        const airesResponse = await api.get('/aires');
        const airesData = airesResponse.data?.data || [];
        setAires(airesData);
        
        // Cargar umbrales
        const umbralesResponse = await api.get('/umbrales');
        const umbralesData = umbralesResponse.data?.data || [];
        
        // Añadir información del aire a cada umbral
        const umbralesConDetalles = umbralesData.map((umbral: Umbral) => {
          if (!umbral.es_global && umbral.aire_id) {
            const aire = airesData.find((a: AireAcondicionado) => a.id === umbral.aire_id);
            return {
              ...umbral,
              aire_nombre: aire?.nombre || 'Desconocido',
              ubicacion: aire?.ubicacion || 'Desconocida'
            };
          }
          return umbral;
        });
        
        setUmbrales(umbralesConDetalles);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    let value: string | number | boolean = target.value;
    const name = target.name;
    
    // Manejar valores numéricos
    if (name === 'temp_min' || name === 'temp_max' || name === 'hum_min' || name === 'hum_max') {
      value = parseFloat(value);
    }
    
    // Manejar checkboxes
    if (target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    }
    
    // Si es_global cambia a true, limpiar aire_id
    if (name === 'es_global' && value === 'true') {
      setFormData({
        ...formData,
        [name]: true,
        aire_id: undefined
      });
    } else if (name === 'es_global' && value === 'false') {
      // Si es_global cambia a false, establecer un aire_id por defecto
      setFormData({
        ...formData,
        [name]: false,
        aire_id: aires.length > 0 ? aires[0].id : undefined
      });
    } else {
      // Para todos los demás campos
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.nombre) {
      errors.push('El nombre es requerido');
    }
    
    if (!formData.es_global && !formData.aire_id) {
      errors.push('Debe seleccionar un aire acondicionado');
    }
    
    if (formData.temp_min === undefined || formData.temp_max === undefined || 
        formData.hum_min === undefined || formData.hum_max === undefined) {
      errors.push('Todos los valores de umbrales son requeridos');
    } else {
      if (formData.temp_min >= formData.temp_max) {
        errors.push('La temperatura mínima debe ser menor que la máxima');
      }
      
      if (formData.hum_min >= formData.hum_max) {
        errors.push('La humedad mínima debe ser menor que la máxima');
      }
    }
    
    return errors;
  };

  // Abrir modal para agregar
  const handleAdd = () => {
    setFormData({
      nombre: '',
      es_global: true,
      aire_id: undefined,
      temp_min: 18,
      temp_max: 25,
      hum_min: 30,
      hum_max: 70,
      notificar_activo: true
    });
    setFormMode('add');
    setSelectedUmbralId(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (umbral: Umbral) => {
    setFormData({
      nombre: umbral.nombre,
      es_global: umbral.es_global,
      aire_id: umbral.aire_id,
      temp_min: umbral.temp_min,
      temp_max: umbral.temp_max,
      hum_min: umbral.hum_min,
      hum_max: umbral.hum_max,
      notificar_activo: umbral.notificar_activo
    });
    setFormMode('edit');
    setSelectedUmbralId(umbral.id);
    setShowModal(true);
  };

  // Eliminar umbral
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta configuración de umbrales?')) {
      try {
        await api.delete(`/umbrales/${id}`);
        setUmbrales(umbrales.filter(umbral => umbral.id !== id));
      } catch (error) {
        console.error('Error al eliminar umbral:', error);
        setError('Error al eliminar la configuración de umbrales');
      }
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }
    
    try {
      if (formMode === 'add') {
        const response = await api.post('/umbrales', formData);
        
        // Crear nuevo umbral con datos completos
        let nuevoUmbral: Umbral = {
          id: response.data.id,
          nombre: formData.nombre!,
          es_global: formData.es_global!,
          temp_min: formData.temp_min!,
          temp_max: formData.temp_max!,
          hum_min: formData.hum_min!,
          hum_max: formData.hum_max!,
          notificar_activo: formData.notificar_activo!
        };
        
        // Si no es global, añadir información del aire
        if (!formData.es_global && formData.aire_id) {
          const aire = aires.find(a => a.id === formData.aire_id);
          nuevoUmbral.aire_id = formData.aire_id;
          nuevoUmbral.aire_nombre = aire?.nombre;
          nuevoUmbral.ubicacion = aire?.ubicacion;
        }
        
        setUmbrales([...umbrales, nuevoUmbral]);
      } else if (selectedUmbralId) {
        await api.put(`/umbrales/${selectedUmbralId}`, formData);
        
        // Actualizar umbral en el estado
        setUmbrales(umbrales.map(umbral => {
          if (umbral.id === selectedUmbralId) {
            const updated: Umbral = {
              ...umbral,
              nombre: formData.nombre!,
              temp_min: formData.temp_min!,
              temp_max: formData.temp_max!,
              hum_min: formData.hum_min!,
              hum_max: formData.hum_max!,
              notificar_activo: formData.notificar_activo!
            };
            return updated;
          }
          return umbral;
        }));
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error al guardar umbral:', error);
      setError('Error al guardar la configuración de umbrales');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Umbrales de Temperatura y Humedad</h1>
        {canEdit && (
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Agregar Configuración
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={12} className="mb-4">
          <Card className="dashboard-card">
            <Card.Header>
              <h5 className="mb-0">Información</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <Alert.Heading>¿Qué son los umbrales?</Alert.Heading>
                <p>
                  Los umbrales son configuraciones que definen los rangos aceptables de temperatura y humedad
                  para los aires acondicionados. Cuando una lectura está fuera de estos rangos, el sistema puede
                  generar alertas para notificar al personal.
                </p>
                <hr />
                <p className="mb-0">
                  Se pueden definir umbrales globales (que aplican a todos los aires) o específicos (para un aire en particular).
                  Los umbrales específicos tienen prioridad sobre los globales.
                </p>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="dashboard-card">
        <Card.Header>
          <h5 className="mb-0">Configuraciones de Umbrales</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando configuraciones de umbrales...</p>
            </div>
          ) : umbrales.length === 0 ? (
            <div className="text-center p-5">
              <FiAlertTriangle size={50} className="text-muted mb-3" />
              <h4>No hay configuraciones de umbrales</h4>
              {canEdit && (
                <Button variant="primary" className="mt-3" onClick={handleAdd}>
                  <FiPlus className="me-2" /> Agregar configuración
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Aire / Ubicación</th>
                    <th>Temperatura (°C)</th>
                    <th>Humedad (%)</th>
                    <th>Notificaciones</th>
                    {canEdit && <th className="text-end">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {umbrales.map(umbral => (
                    <tr key={umbral.id}>
                      <td>{umbral.nombre}</td>
                      <td>
                        {umbral.es_global ? (
                          <Badge bg="primary">
                            <FiGlobe className="me-1" /> Global
                          </Badge>
                        ) : (
                          <Badge bg="info">
                            <FiWind className="me-1" /> Específico
                          </Badge>
                        )}
                      </td>
                      <td>
                        {umbral.es_global ? (
                          <span className="text-muted">Todos los aires</span>
                        ) : (
                          <span>
                            {umbral.aire_nombre} <br />
                            <small className="text-muted">{umbral.ubicacion}</small>
                          </span>
                        )}
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              Rango aceptable de temperatura
                            </Tooltip>
                          }
                        >
                          <Badge bg="light" text="dark">
                            <FiThermometer className="me-1 text-danger" />
                            {umbral.temp_min} - {umbral.temp_max} °C
                          </Badge>
                        </OverlayTrigger>
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              Rango aceptable de humedad
                            </Tooltip>
                          }
                        >
                          <Badge bg="light" text="dark">
                            <FiDroplet className="me-1 text-primary" />
                            {umbral.hum_min} - {umbral.hum_max} %
                          </Badge>
                        </OverlayTrigger>
                      </td>
                      <td>
                        {umbral.notificar_activo ? (
                          <Badge bg="success">
                            <FiBell className="me-1" /> Activas
                          </Badge>
                        ) : (
                          <Badge bg="secondary">
                            <FiSlash className="me-1" /> Inactivas
                          </Badge>
                        )}
                      </td>
                      {canEdit && (
                        <td className="text-end">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEdit(umbral)}
                          >
                            <FiEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(umbral.id)}
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
          <Modal.Title>
            {formMode === 'add' ? 'Agregar Configuración' : 'Editar Configuración'}
          </Modal.Title>
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
                placeholder="Ej: Sala de Servidores - Estándar"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Configuración</Form.Label>
              <Form.Select
                name="es_global"
                value={formData.es_global ? 'true' : 'false'}
                onChange={handleChange}
                disabled={formMode === 'edit'}
              >
                <option value="true">Global (todos los aires)</option>
                <option value="false">Específico (un aire)</option>
              </Form.Select>
            </Form.Group>
            
            {!formData.es_global && (
              <Form.Group className="mb-3">
                <Form.Label>Aire Acondicionado</Form.Label>
                <Form.Select
                  name="aire_id"
                  value={formData.aire_id || ''}
                  onChange={handleChange}
                  required={!formData.es_global}
                  disabled={formMode === 'edit'}
                >
                  <option value="">Seleccione un aire acondicionado</option>
                  {aires.map(aire => (
                    <option key={aire.id} value={aire.id}>
                      {aire.nombre} - {aire.ubicacion}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            
            <hr />
            
            <h6 className="mb-3">Umbrales de Temperatura</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mínima (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="temp_min"
                    value={formData.temp_min || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Máxima (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="temp_max"
                    value={formData.temp_max || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <h6 className="mb-3">Umbrales de Humedad</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mínima (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="hum_min"
                    value={formData.hum_min || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Máxima (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="hum_max"
                    value={formData.hum_max || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Activar notificaciones para esta configuración"
                name="notificar_activo"
                checked={formData.notificar_activo || false}
                onChange={(e) => setFormData({
                  ...formData,
                  notificar_activo: e.target.checked
                })}
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

export default Umbrales;