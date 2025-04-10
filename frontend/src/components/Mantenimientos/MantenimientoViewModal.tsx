import React from "react";
import { Modal, Button, Row, Col, ListGroup, Badge, Image } from "react-bootstrap";
import {
  FiTool,
  FiMapPin,
  FiCalendar,
  FiInfo,
  FiUser,
  FiImage,
} from "react-icons/fi";
import api from "../../services/api"; // Ajusta la ruta si es necesario

// Define la interfaz Mantenimiento aquí o impórtala si la tienes en un archivo separado
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

interface MantenimientoViewModalProps {
  show: boolean;
  onHide: () => void;
  mantenimiento: Mantenimiento | null;
  onShowImagen: (imagenUrl: string | undefined) => void;
  getBadgeColor: (tipo: string | undefined) => string;
  formatearFechaHora: (fechaStr: string | undefined) => string;
}

const MantenimientoViewModal: React.FC<MantenimientoViewModalProps> = ({
  show,
  onHide,
  mantenimiento,
  onShowImagen,
  getBadgeColor,
  formatearFechaHora,
}) => {
  if (!mantenimiento) {
    return null; // No renderizar nada si no hay mantenimiento seleccionado
  }

  const fullImageUrl = mantenimiento.imagen?.startsWith("http")
    ? mantenimiento.imagen
    : `${api.defaults.baseURL}${mantenimiento.imagen}`;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Detalles del Mantenimiento (ID: {mantenimiento.id})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={7}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <FiTool className="me-2 text-primary" />{" "}
                <strong>Aire Acondicionado:</strong> {mantenimiento.aire_nombre}
              </ListGroup.Item>
              <ListGroup.Item>
                <FiMapPin className="me-2 text-secondary" />{" "}
                <strong>Ubicación:</strong> {mantenimiento.ubicacion}
              </ListGroup.Item>
              <ListGroup.Item>
                <FiCalendar className="me-2 text-success" />{" "}
                <strong>Fecha y Hora:</strong>{" "}
                {formatearFechaHora(mantenimiento.fecha)}
              </ListGroup.Item>
              <ListGroup.Item>
                <FiInfo className="me-2" /> <strong>Tipo:</strong>{" "}
                <Badge bg={getBadgeColor(mantenimiento.tipo_mantenimiento)}>
                  {mantenimiento.tipo_mantenimiento}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                <FiUser className="me-2 text-info" />{" "}
                <strong>Técnico:</strong> {mantenimiento.tecnico}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Descripción:</strong>
                <p style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>
                  {mantenimiento.descripcion}
                </p>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={5}>
            <strong>Imagen:</strong>
            {mantenimiento.imagen ? (
              <div className="mt-2 text-center">
                <Image
                  src={fullImageUrl}
                  thumbnail
                  fluid
                  style={{ maxHeight: "300px", cursor: "pointer" }}
                  onClick={() => onShowImagen(mantenimiento.imagen)}
                  title="Haz clic para ampliar la imagen"
                />
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2"
                  onClick={() => onShowImagen(mantenimiento.imagen)}
                >
                  <FiImage className="me-1" /> Ver Imagen Completa
                </Button>
              </div>
            ) : (
              <p className="text-muted mt-2">
                No hay imagen registrada para este mantenimiento.
              </p>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        {/* Puedes añadir un botón de editar aquí si lo necesitas, pasando la función como prop */}
      </Modal.Footer>
    </Modal>
  );
};

export default MantenimientoViewModal;
