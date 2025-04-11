import React from 'react';
import { Modal, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FiWind, FiMapPin, FiCalendar, FiTag, FiSettings, FiThermometer, FiDroplet, FiZap, FiTool, FiActivity, FiInfo } from 'react-icons/fi';

// Reutilizamos la interfaz completa
interface AireAcondicionado {
    id: number;
    nombre: string;
    ubicacion: string;
    fecha_instalacion: string;
    marca?: string;
    modelo?: string;
    numero_serie?: string;
    capacidad_btu?: number | null;
    tipo_refrigerante?: string;
    eficiencia_energetica?: string;
    fecha_ultimo_mantenimiento?: string | null;
    estado?: string;
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

    const getEstadoColor = (estado?: string): string => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'success';
            case 'inactivo': return 'secondary';
            case 'mantenimiento': return 'warning';
            default: return 'dark';
        }
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
                        <ListGroup.Item>
                            <FiWind className="me-2 text-primary" /> <strong>Nombre:</strong> {selectedAireDetails.nombre}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <FiMapPin className="me-2 text-success" /> <strong>Ubicación:</strong> {selectedAireDetails.ubicacion}
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <FiCalendar className="me-2 text-info" /> <strong>Fecha Instalación:</strong> {formatDate(selectedAireDetails.fecha_instalacion)}
                        </ListGroup.Item>
                        {selectedAireDetails.marca && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-secondary" /> <strong>Marca:</strong> {selectedAireDetails.marca}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.modelo && (
                            <ListGroup.Item>
                                <FiSettings className="me-2 text-secondary" /> <strong>Modelo:</strong> {selectedAireDetails.modelo}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.numero_serie && (
                            <ListGroup.Item>
                                <FiTag className="me-2 text-muted" /> <strong>Número de Serie:</strong> {selectedAireDetails.numero_serie}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.capacidad_btu != null && (
                            <ListGroup.Item>
                                <FiThermometer className="me-2 text-danger" /> <strong>Capacidad:</strong> {selectedAireDetails.capacidad_btu} BTU
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.tipo_refrigerante && (
                            <ListGroup.Item>
                                <FiDroplet className="me-2 text-info" /> <strong>Refrigerante:</strong> {selectedAireDetails.tipo_refrigerante}
                            </ListGroup.Item>
                        )}
                        {selectedAireDetails.eficiencia_energetica && (
                            <ListGroup.Item>
                                <FiZap className="me-2 text-warning" /> <strong>Eficiencia Energética:</strong> {selectedAireDetails.eficiencia_energetica}
                            </ListGroup.Item>
                        )}
                        <ListGroup.Item>
                            <FiTool className="me-2 text-dark" /> <strong>Último Mantenimiento:</strong> {formatDate(selectedAireDetails.fecha_ultimo_mantenimiento) || 'N/A'}
                        </ListGroup.Item>
                        {selectedAireDetails.estado && (
                            <ListGroup.Item>
                                <FiActivity className="me-2" />
                                <strong>Estado:</strong> <span className={`fw-bold text-${getEstadoColor(selectedAireDetails.estado)}`}>{selectedAireDetails.estado}</span>
                            </ListGroup.Item>
                        )}
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
