// src/components/Mantenimientos/MantenimientoViewModal.tsx
import React from "react";
import { Modal, Button, Row, Col, Badge, Alert } from "react-bootstrap"; // Import Badge
import {
  FiTool,
  FiMapPin,
  FiCalendar,
  FiInfo,
  FiUser,
  FiImage,
  FiBox, // Icon for Equipo
  FiTag, // Icon for Tipo Equipo
  FiHash, // Icon for ID
  FiFileText, // Icon for Descripción
  FiCheckSquare, // Icon for Tiene Imagen (alternative)
  FiXSquare, // Icon for No Tiene Imagen (alternative)
} from "react-icons/fi";
// No necesitas api aquí si solo muestras datos
import { Mantenimiento } from '../../pages/Mantenimientos'; // Importar tipo

interface MantenimientoViewModalProps {
  show: boolean;
  onHide: () => void;
  mantenimiento: Mantenimiento | null;
  // Modificado para aceptar el ID (como string o number) o undefined
  onShowImagen: (mantenimientoId: string | number | undefined) => void;
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

  // --- Helper Function to Render Details with Icon ---
  const renderDetail = (
    icon: React.ElementType | null, // Icon component (e.g., FiCalendar)
    label: string,
    value: React.ReactNode // Can be string, number, boolean, or a React element
  ) => {
    let displayValue: React.ReactNode = <span className="text-muted fst-italic">N/A</span>; // Default for null/undefined/empty

    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'boolean') {
        // Render boolean as a Badge
        displayValue = (
          <Badge pill bg={value ? 'success' : 'secondary'} className="d-flex align-items-center">
            {value ? <FiCheckSquare className="me-1"/> : <FiXSquare className="me-1"/>}
            {value ? 'Sí' : 'No'}
          </Badge>
        );
      } else {
        // Render string, number, or existing React element directly
        displayValue = value;
      }
    }

    return (
      // Use Row/Col for better alignment and responsiveness
      <Row className="mb-2 align-items-center">
        <Col xs={12} md={4} className="fw-bold text-muted d-flex align-items-center">
          {icon && React.createElement(icon, { className: "me-2 flex-shrink-0", size: 18 })}
          <span>{label}:</span>
        </Col>
        <Col xs={12} md={8}>
          {/* Wrap long text like descriptions */}
          {typeof value === 'string' && value.length > 100 ? (
             <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayValue}</div>
          ) : (
             displayValue
          )}
        </Col>
      </Row>
    );
  };
  // --- End Helper Function ---

  if (!mantenimiento) {
    return null; // No renderizar nada si no hay mantenimiento seleccionado
  }

  // Pre-render the badge for Tipo Mantenimiento so it's passed correctly
  const tipoMantenimientoBadge = mantenimiento.tipo_mantenimiento ? (
    <Badge bg={getBadgeColor(mantenimiento.tipo_mantenimiento)}>
      {mantenimiento.tipo_mantenimiento}
    </Badge>
  ) : null; // Handle case where tipo might be missing

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FiInfo className="me-2" /> Detalles del Mantenimiento
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {mantenimiento ? (
          <>
            {renderDetail(FiHash, 'ID Mantenimiento', mantenimiento.id)}
            {renderDetail(FiCalendar, 'Fecha Registro', formatearFechaHora(mantenimiento.fecha))}
            <hr className="my-3" /> {/* Separator */}
            <h5 className="mb-3"><FiBox className="me-2"/>Información del Equipo</h5>
            {renderDetail(null, 'Nombre Equipo', mantenimiento.equipo_nombre)}
            {renderDetail(FiMapPin, 'Ubicación', mantenimiento.equipo_ubicacion)}
            {renderDetail(FiTag, 'Tipo Equipo', mantenimiento.equipo_tipo)}
            {/* Opcional: Mostrar IDs si es útil para depuración */}
            {/* {renderDetail(FiHash, 'Aire ID', mantenimiento.aire_id)} */}
            {/* {renderDetail(FiHash, 'Otro Equipo ID', mantenimiento.otro_equipo_id)} */}
            <hr className="my-3" /> {/* Separator */}
            <h5 className="mb-3"><FiTool className="me-2"/>Detalles del Trabajo</h5>
            {/* Pass the pre-rendered badge here */}
            {renderDetail(null, 'Tipo Mantenimiento', tipoMantenimientoBadge)}
            {renderDetail(FiUser, 'Técnico', mantenimiento.tecnico)}
            {renderDetail(FiFileText, 'Descripción', mantenimiento.descripcion)}
            {renderDetail(FiImage, 'Tiene Imagen Adjunta', mantenimiento.tiene_imagen)}

            {/* Botón para ver imagen si tiene */}
            {mantenimiento.tiene_imagen && (
              <Row className="mt-3">
                <Col md={{ span: 8, offset: 4 }}> {/* Align with value column */}
                  <Button
                    variant="outline-primary" // Changed variant for better look
                    size="sm"
                    onClick={() => onShowImagen(mantenimiento.id)} // Pass ID directly
                    className="d-flex align-items-center"
                  >
                    <FiImage className="me-2" /> Ver Imagen Adjunta
                  </Button>
                </Col>
              </Row>
            )}
          </>
        ) : (
          // Este caso no debería ocurrir si se maneja el !mantenimiento arriba, pero por si acaso
          <Alert variant="warning">No hay detalles para mostrar.</Alert>
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
