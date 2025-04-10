import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
  Image,
  ListGroup, 
  Dropdown,
} from "react-bootstrap";
import {
  FiPlus,
  FiTrash2,
  FiFilter,
  FiTool,
  FiCalendar,
  FiInfo,
  FiUser,
  FiImage,
  FiMapPin, // Added for location icon
  FiClock, // Added for time icon
} from "react-icons/fi";
import api from "../services/api";
import { useAppContext } from "../context/AppContext";

interface Mantenimiento {
  id: number;
  aire_id: number;
  fecha: string; // Keep as string from API
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
  const [showAddModal, setShowAddModal] = useState<boolean>(false); // Renamed for clarity
  const [showImagenModal, setShowImagenModal] = useState<boolean>(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(
    null
  );
  const [showViewModal, setShowViewModal] = useState<boolean>(false); // State for the view modal
  const [selectedMantenimiento, setSelectedMantenimiento] =
    useState<Mantenimiento | null>(null); // State for the selected maintenance

  const [formData, setFormData] = useState({
    aire_id: "",
    tipo_mantenimiento: "",
    descripcion: "",
    tecnico: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar si el usuario puede agregar/eliminar mantenimientos
  const canEdit = user?.rol === "admin" || user?.rol === "supervisor";

  // Cargar aires y mantenimientos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar aires
        const airesResponse = await api.get("/aires");
        const airesData = airesResponse.data?.data || airesResponse.data || []; // Handle both nested and direct array
        setAires(airesData);

        // Cargar mantenimientos
        let url = "/mantenimientos";
        if (filtroAire) {
          url += `?aire_id=${filtroAire}`;
        }
        const mantenimientosResponse = await api.get(url);
        const mantenimientosData = mantenimientosResponse.data?.data || mantenimientosResponse.data || []; // Handle both nested and direct array

        // Añadir información del aire a cada mantenimiento
        const mantenimientosConDetalles = mantenimientosData.map(
          (mantenimiento: Mantenimiento) => {
            const aire = airesData.find(
              (a: AireAcondicionado) => a.id === mantenimiento.aire_id
            );
            return {
              ...mantenimiento,
              aire_nombre: aire?.nombre || "Desconocido",
              ubicacion: aire?.ubicacion || "Desconocida",
            };
          }
        );

        setMantenimientos(mantenimientosConDetalles);
      } catch (error: any) { // Added type annotation
        console.error("Error al cargar datos:", error);
        const message = error.response?.data?.mensaje || "Error al cargar los datos. Verifique la conexión con el servidor.";
        setError(message);
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

  // Manejar cambios en el formulario de agregar
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Abrir modal para agregar
  const handleAdd = () => {
    setFormData({
      aire_id: aires.length > 0 ? aires[0].id.toString() : "",
      tipo_mantenimiento: "",
      descripcion: "",
      tecnico: "",
    });
    // Reset file input if it exists
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setShowAddModal(true); // Use the renamed state
    setShowViewModal(false); // Ensure view modal is closed
  };

  // Eliminar mantenimiento
  const handleDelete = async (id: number) => {
    if (
      window.confirm("¿Está seguro de eliminar este registro de mantenimiento?")
    ) {
      try {
        await api.delete(`/mantenimientos/${id}`);
        setMantenimientos(mantenimientos.filter((m) => m.id !== id));
        setError(null); // Clear error on success
      } catch (error: any) { // Added type annotation
        console.error("Error al eliminar mantenimiento:", error);
        const message = error.response?.data?.mensaje || "Error al eliminar el registro de mantenimiento";
        setError(message);
      }
    }
  };

  // Mostrar imagen en modal
  const handleShowImagen = (imagenUrl: string | undefined) => {
    if (imagenUrl) {
        // Prepend base URL if the image URL is relative
        const fullImageUrl = imagenUrl.startsWith('http') ? imagenUrl : `${api.defaults.baseURL}${imagenUrl}`;
        setImagenSeleccionada(fullImageUrl);
        setShowImagenModal(true);
    }
  };

  // Enviar formulario de agregar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const formDataObj = new FormData();
      formDataObj.append("aire_id", formData.aire_id);
      formDataObj.append("tipo_mantenimiento", formData.tipo_mantenimiento);
      formDataObj.append("descripcion", formData.descripcion);
      formDataObj.append("tecnico", formData.tecnico);

      if (
        fileInputRef.current?.files &&
        fileInputRef.current.files.length > 0
      ) {
        formDataObj.append("imagen_file", fileInputRef.current.files[0]);
      }

      const response = await api.post("/mantenimientos", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Assuming the API returns the full new maintenance object including the image URL
      const nuevoMantenimientoCompleto: Mantenimiento = response.data.data || response.data;

      // Find the corresponding aire details again (needed if API doesn't return them)
      const aire = aires.find((a) => a.id === nuevoMantenimientoCompleto.aire_id);

      // Add aire details if not present in the response
      const finalNuevoMantenimiento = {
          ...nuevoMantenimientoCompleto,
          aire_nombre: nuevoMantenimientoCompleto.aire_nombre || aire?.nombre || "Desconocido",
          ubicacion: nuevoMantenimientoCompleto.ubicacion || aire?.ubicacion || "Desconocida",
      };


      setMantenimientos([finalNuevoMantenimiento, ...mantenimientos]); // Add to the beginning of the list
      setShowAddModal(false); // Use the renamed state
    } catch (error: any) { // Added type annotation
      console.error("Error al guardar mantenimiento:", error);
      const message = error.response?.data?.mensaje || "Error al guardar el registro de mantenimiento";
      setError(message);
    }
  };

  // Formatear fecha y hora
  const formatearFechaHora = (fechaStr: string | undefined): string => {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';
        return fecha.toLocaleString('es-ES', { // Use locale for formatting
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Use 24-hour format
        });
    } catch (e) {
        console.error("Error formatting date:", fechaStr, e);
        return 'Error fecha';
    }
  };


  // Obtener color de badge según tipo de mantenimiento
  const getBadgeColor = (tipo: string | undefined) => {
    switch (tipo?.toLowerCase()) { // Added safe navigation
      case "preventivo":
        return "success";
      case "correctivo":
        return "danger";
      case "predictivo":
        return "info";
      case "instalación":
        return "primary";
      case "limpieza":
        return "warning"; // Added color for Limpieza
      default:
        return "secondary";
    }
  };

  // --- Function to open the View Modal ---
  const handleShowViewModal = (mantenimiento: Mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowViewModal(true);
    setShowAddModal(false); // Ensure add modal is closed
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2"> {/* Added flex-wrap and gap */}
        <h1>Mantenimientos</h1>
        <div className="d-flex align-items-center flex-wrap gap-2"> {/* Added flex-wrap and gap */}
          {/* Filter Dropdown */}
          <Dropdown className="d-inline-block">
            <Dropdown.Toggle variant="outline-secondary" id="dropdown-filtro-mantenimiento">
              <FiFilter className="me-2" />
              {filtroAire ? `Filtro: ${aires.find(a => a.id === filtroAire)?.nombre}` : 'Todos los aires'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleFiltrarPorAire(null)}>
                Todos los aires
              </Dropdown.Item>
              <Dropdown.Divider />
              {aires.map(aire => (
                <Dropdown.Item
                  key={aire.id}
                  onClick={() => handleFiltrarPorAire(aire.id)}
                  active={filtroAire === aire.id}
                >
                  {aire.nombre} - {aire.ubicacion}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          {/* Add Button */}
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
              <h4>No hay registros de mantenimiento {filtroAire ? `para ${aires.find(a => a.id === filtroAire)?.nombre}` : ''}</h4>
              {canEdit && (
                <Button variant="primary" className="mt-3" onClick={handleAdd}>
                  <FiPlus className="me-2" /> Registrar primer mantenimiento
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mantenimientos-table"> {/* Added class for potential styling */}
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Aire Acondicionado</th>
                    <th>Ubicación</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Técnico</th>
                    <th className="text-center">Imagen</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mantenimientos.map((mantenimiento) => (
                    <tr key={mantenimiento.id} onClick={() => handleShowViewModal(mantenimiento)} style={{ cursor: 'pointer' }}>
                      <td>{mantenimiento.id}</td>
                      <td>{mantenimiento.aire_nombre}</td>
                      <td>{mantenimiento.ubicacion}</td>
                      <td>
                        <FiCalendar className="me-1" />
                        {formatearFechaHora(mantenimiento.fecha).split(' ')[0]} {/* Show only date part */}
                      </td>
                      <td>
                        <Badge
                          bg={getBadgeColor(mantenimiento.tipo_mantenimiento)}
                        >
                          {mantenimiento.tipo_mantenimiento}
                        </Badge>
                      </td>
                      <td>
                        <FiUser className="me-1" />
                        {mantenimiento.tecnico}
                      </td>
                      <td className="text-center">
                        {mantenimiento.imagen ? (
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row click when clicking the button
                                handleShowImagen(mantenimiento.imagen)
                            }}
                            title="Ver Imagen">
                            <FiImage />
                          </Button>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end">
                         <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleShowViewModal(mantenimiento);
                            }}
                            title="Ver Detalles"
                         >
                            <FiInfo />
                         </Button>
                        {canEdit && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row click when clicking the button
                                handleDelete(mantenimiento.id)
                            }}
                            title="Eliminar Mantenimiento">
                            <FiTrash2 />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de formulario para AGREGAR */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
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
                {aires.map((aire) => (
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
                placeholder="Detalle las tareas realizadas..."
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
                placeholder="Nombre del técnico"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Imagen (opcional)</Form.Label>
              <Form.Control type="file" ref={fileInputRef} accept="image/*" />
              <Form.Text className="text-muted">
                Suba una imagen relacionada al mantenimiento (ej: antes/después, pieza cambiada).
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Registro
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para VER IMAGEN */}
      <Modal
        show={showImagenModal}
        onHide={() => setShowImagenModal(false)}
        centered
        size="lg" // Make image modal larger
      >
        <Modal.Header closeButton>
          <Modal.Title>Imagen de Mantenimiento</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {imagenSeleccionada ? (
             <Image src={imagenSeleccionada} fluid style={{ maxHeight: '70vh' }} /> // Limit height
          ) : (
             <p>No se pudo cargar la imagen.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImagenModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- Modal para VER DETALLES --- */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Mantenimiento (ID: {selectedMantenimiento?.id})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMantenimiento ? (
            <Row>
              <Col md={7}>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <FiTool className="me-2 text-primary" /> <strong>Aire Acondicionado:</strong> {selectedMantenimiento.aire_nombre}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FiMapPin className="me-2 text-secondary" /> <strong>Ubicación:</strong> {selectedMantenimiento.ubicacion}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FiCalendar className="me-2 text-success" /> <strong>Fecha y Hora:</strong> {formatearFechaHora(selectedMantenimiento.fecha)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FiInfo className="me-2" /> <strong>Tipo:</strong>{' '}
                    <Badge bg={getBadgeColor(selectedMantenimiento.tipo_mantenimiento)}>
                      {selectedMantenimiento.tipo_mantenimiento}
                    </Badge>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FiUser className="me-2 text-info" /> <strong>Técnico:</strong> {selectedMantenimiento.tecnico}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Descripción:</strong>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{selectedMantenimiento.descripcion}</p>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={5}>
                <strong>Imagen:</strong>
                {selectedMantenimiento.imagen ? (
                  <div className="mt-2 text-center">
                    <Image
                      src={selectedMantenimiento.imagen.startsWith('http') ? selectedMantenimiento.imagen : `${api.defaults.baseURL}${selectedMantenimiento.imagen}`}
                      thumbnail
                      fluid
                      style={{ maxHeight: '300px', cursor: 'pointer' }}
                      onClick={() => handleShowImagen(selectedMantenimiento.imagen)}
                      title="Haz clic para ampliar la imagen"
                    />
                    <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleShowImagen(selectedMantenimiento.imagen)}
                    >
                        <FiImage className="me-1" /> Ver Imagen Completa
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted mt-2">No hay imagen registrada para este mantenimiento.</p>
                )}
              </Col>
            </Row>
          ) : (
            <p>No se ha seleccionado ningún mantenimiento.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
          {/* Optional: Add Edit button here if needed */}
          {/*
          {canEdit && selectedMantenimiento && (
            <Button variant="primary" onClick={() => {
                // Logic to open edit modal with selectedMantenimiento data
                setShowViewModal(false);
                // handleEdit(selectedMantenimiento); // Assuming you have an handleEdit function
            }}>
              <FiEdit className="me-2" /> Editar
            </Button>
          )}
          */}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Mantenimientos;
