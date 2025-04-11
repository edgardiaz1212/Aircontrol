import React from 'react';
import { Modal, Button, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap'; // Añadir Badge
import { FiWind, FiMapPin, FiCalendar, FiTag, FiSettings, FiThermometer, FiPackage, FiZap, FiInfo, FiCheckCircle, FiXCircle } from 'react-icons/fi'; // Ajustar iconos

// --- Interfaz actualizada (debe coincidir con la de Aires.tsx) ---
interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
  fecha_instalacion: string;
  tipo?: string;
  toneladas?: number | null;
  // Evaporadora
  evaporadora_operativa?: boolean;
  evaporadora_marca?: string;
  evaporadora_modelo?: string;
  evaporadora_serial?: string;
  evaporadora_codigo_inventario?: string;
  evaporadora_ubicacion_instalacion?: string;
  // Condensadora
  condensadora_operativa?: boolean;
  condensadora_marca?: string;
  condensadora_modelo?: string;
  condensadora_serial?: string;
  condensadora_codigo_inventario?: string;
  condensadora_ubicacion_instalacion?: string;
}

interface AiresViewModalProps {
    show: boolean;
    onHide: () => void;
    selectedAireDetails: AireAcondicionado | null;
    loadingDetails: boolean;
    viewError: string | null;
    formatDate: (dateString: string | null | undefined, forInput?: boolean) => string;
}

const AiresViewModal: React.FC<AiresViewModalProps> = ({
    show,
    onHide,
    selectedAireDetails,
    loadingDetails,
    viewError,
    formatDate
}) => {

    // Helper para mostrar booleanos de forma legible
    const renderBoolean = (value: boolean | undefined | null) => {
        if (value === true) {
            return <Badge bg="success"><FiCheckCircle className="me-1" /> Sí</Badge>;
        }
        if (value === false) {
            return <Badge bg="danger"><FiXCircle className="me-1" /> No</Badge>;
        }
        return <Badge bg="secondary">N/A</Badge>;
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <FiInfo className="me-2" /> Detalles del Aire Acondicionado
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingDetails ? (
                    <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 mb-0">Cargando detalles...</p>
                    </div>
                ) : viewError ? (
                    <Alert variant="danger">{viewError}</Alert>
                ) : selectedAireDetails ? (
                    <ListGroup variant="flush">
                        {/* Información General */}
                        <ListGroup.Item className="bg-light fw-bold">Información General</ListGroup.Item>
                        <ListGroup.Item>
                            <FiWind className="me-2 text-primary" /> <strong>Nombre:</strong> {selectedAireDetails.nombre}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <FiMapPin className="me-2 text-success" /> <strong>Ubicación General:</strong> {selectedAireDetails.ubicacion}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <FiCalendar className="me-2 text-info" /> <strong>Fecha Instalación:</strong> {formatDate(selectedAireDetails.fecha_instalacion)}
                        </ListGroup.Item>
                        {selectedAireDetails.tipo && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-secondary" /> <strong>Tipo:</strong> {selectedAireDetails.tipo}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.toneladas != null && ( // Usar toneladas en lugar de capacidad_btu
                            <ListGroup.Item>
                                <FiThermometer className="me-2 text-danger" /> <strong>Capacidad:</strong> {selectedAireDetails.toneladas} Toneladas
                            </ListGroup.Item>
                        )}

                        {/* Unidad Evaporadora */}
                        <ListGroup.Item className="bg-light fw-bold mt-3">Unidad Evaporadora</ListGroup.Item>
                        <ListGroup.Item>
                             <strong>Operativa:</strong> {renderBoolean(selectedAireDetails.evaporadora_operativa)}
                        </ListGroup.Item>
                        {selectedAireDetails.evaporadora_marca && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-secondary" /> <strong>Marca:</strong> {selectedAireDetails.evaporadora_marca}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.evaporadora_modelo && (
                            <ListGroup.Item>
                                <FiSettings className="me-2 text-secondary" /> <strong>Modelo:</strong> {selectedAireDetails.evaporadora_modelo}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.evaporadora_serial && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-muted" /> <strong>Serial:</strong> {selectedAireDetails.evaporadora_serial}
                            </ListGroup.Item>
                        )}
                         {selectedAireDetails.evaporadora_codigo_inventario && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-muted" /> <strong>Cód. Inventario:</strong> {selectedAireDetails.evaporadora_codigo_inventario}
                            </ListGroup.Item>
                        )}
                         {selectedAireDetails.evaporadora_ubicacion_instalacion && (
                            <ListGroup.Item>
                                <FiMapPin className="me-2 text-muted" /> <strong>Ubicación Específica:</strong> {selectedAireDetails.evaporadora_ubicacion_instalacion}
                            </ListGroup.Item>
                        )}

                        {/* Unidad Condensadora */}
                        <ListGroup.Item className="bg-light fw-bold mt-3">Unidad Condensadora</ListGroup.Item>
                         <ListGroup.Item>
                             <strong>Operativa:</strong> {renderBoolean(selectedAireDetails.condensadora_operativa)}
                        </ListGroup.Item>
                        {selectedAireDetails.condensadora_marca && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-secondary" /> <strong>Marca:</strong> {selectedAireDetails.condensadora_marca}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.condensadora_modelo && (
                            <ListGroup.Item>
                                <FiSettings className="me-2 text-secondary" /> <strong>Modelo:</strong> {selectedAireDetails.condensadora_modelo}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.condensadora_serial && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-muted" /> <strong>Serial:</strong> {selectedAireDetails.condensadora_serial}
                            </ListGroup.Item>
                        )}
                         {selectedAireDetails.condensadora_codigo_inventario && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-muted" /> <strong>Cód. Inventario:</strong> {selectedAireDetails.condensadora_codigo_inventario}
                            </ListGroup.Item>
                        )}
                         {selectedAireDetails.condensadora_ubicacion_instalacion && (
                            <ListGroup.Item>
                                <FiMapPin className="me-2 text-muted" /> <strong>Ubicación Específica:</strong> {selectedAireDetails.condensadora_ubicacion_instalacion}
                            </ListGroup.Item>
                        )}

                        {/* Campos eliminados (ya no se muestran):
                            - marca (general)
                            - modelo (general)
                            - numero_serie (general)
                            - capacidad_btu
                            - tipo_refrigerante
                            - eficiencia_energetica
                            - fecha_ultimo_mantenimiento
                            - estado
                        */}
                    </ListGroup>
                ) : (
                    <Alert variant="secondary">No hay detalles para mostrar.</Alert>
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

export default AiresViewModal;
