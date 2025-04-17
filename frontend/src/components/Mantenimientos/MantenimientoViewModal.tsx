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
import { Mantenimiento } from '../../pages/Mantenimientos';



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



    const renderDetail = (label: string, value: React.ReactNode) => {
      // ... (lógica de renderDetail sin cambios) ...
       let displayValue: React.ReactNode = '-';
      if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'boolean') {
              displayValue = (
                  <span className={`badge bg-${value ? 'success' : 'danger'}`}>
                      {value ? 'Sí' : 'No'}
                  </span>
              );
          } else {
              displayValue = value.toString();
          }
      }

      return (
          <React.Fragment key={label}> {/* Añadir key para elementos en loop implícito */}
              <Col xs={5} sm={4} className="text-muted">{label}:</Col>
              <Col xs={7} sm={8}>{displayValue}</Col>
          </React.Fragment>
      );
  };

  return (
      <Modal show={show} onHide={onHide} size="lg" centered>
          <Modal.Header closeButton>
              <Modal.Title>Detalles del Mantenimiento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              {/* Quitar Alerta de error y Spinner si ya no se manejan aquí */}
              {/* {viewError && <Alert variant="danger">{viewError}</Alert>} */}
              {/* {loadingDetails && (...)} */}

              {mantenimiento ? ( // Verifica si hay un mantenimiento seleccionado
                  <Row className="g-3">
                      {renderDetail('ID', mantenimiento.id)}
                      {renderDetail('Fecha', formatearFechaHora(mantenimiento.fecha))}
                      {/* Mostrar info del equipo unificada */}
                      {renderDetail('Equipo', mantenimiento.equipo_nombre)}
                      {renderDetail('Ubicación Equipo', mantenimiento.equipo_ubicacion)}
                      {renderDetail('Tipo Equipo', mantenimiento.equipo_tipo)}
                      {/* Opcional: Mostrar IDs si es útil */}
                      {/* {renderDetail('Aire ID', mantenimiento.aire_id)} */}
                      {/* {renderDetail('Otro Equipo ID', mantenimiento.otro_equipo_id)} */}
                      {renderDetail('Tipo Mantenimiento', (
                          <span className={`badge bg-${getBadgeColor(mantenimiento.tipo_mantenimiento)}`}>
                              {mantenimiento.tipo_mantenimiento}
                          </span>
                      ))}
                      {renderDetail('Técnico', mantenimiento.tecnico)}
                      {renderDetail('Descripción', mantenimiento.descripcion)}
                      {renderDetail('Tiene Imagen', mantenimiento.tiene_imagen)}
                      {/* Botón para ver imagen si tiene */}
                      {mantenimiento.tiene_imagen && (
                           <Col xs={12} className="mt-3 text-center">
                              <Button variant="outline-secondary" size="sm" onClick={() => onShowImagen(mantenimiento.id.toString())}>
                                  Ver Imagen Adjunta
                              </Button>
                          </Col>
                      )}
                  </Row>
              ) : (
                  <p>No hay detalles para mostrar.</p> // Mensaje si no hay mantenimiento
              )}
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={onHide}>
                  Cerrar
              </Button>
          </Modal.Footer>
      </Modal>
  );
};

export default MantenimientoViewModal;