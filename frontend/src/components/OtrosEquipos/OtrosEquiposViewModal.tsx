// src/components/OtrosEquipos/OtrosEquiposViewModal.tsx
import React from 'react';
import { Modal, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';

// Interfaz completa del equipo
interface OtroEquipo {
    id: number;
    nombre: string;
    tipo: 'Motogenerador' | 'UPS' | 'PDU' | 'Otro';
    ubicacion?: string | null;
    marca?: string | null;
    modelo?: string | null;
    serial?: string | null;
    codigo_inventario?: string | null;
    fecha_instalacion?: string | null; // Formato YYYY-MM-DD
    estado_operativo: boolean;
    notas?: string | null;
    fecha_creacion?: string; // Formato YYYY-MM-DD HH:MM:SS
    ultima_modificacion?: string; // Formato YYYY-MM-DD HH:MM:SS
}

interface OtrosEquiposViewModalProps {
    show: boolean;
    onHide: () => void;
    selectedEquipoDetails: OtroEquipo | null;
    loadingDetails: boolean;
    viewError: string | null;
    formatDate: (dateString: string | null | undefined, forInput?: boolean) => string; // Reutilizar formatDate
}

const OtrosEquiposViewModal: React.FC<OtrosEquiposViewModalProps> = ({
    show,
    onHide,
    selectedEquipoDetails,
    loadingDetails,
    viewError,
    formatDate,
}) => {

    const renderDetail = (label: string, value: string | number | boolean | null | undefined) => {
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
            <>
                <Col xs={5} sm={4} className="text-muted">{label}:</Col>
                <Col xs={7} sm={8}>{displayValue}</Col>
            </>
        );
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Detalles del Equipo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {viewError && <Alert variant="danger">{viewError}</Alert>}
                {loadingDetails && (
                    <div className="text-center">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Cargando detalles...</p>
                    </div>
                )}
                {selectedEquipoDetails && !loadingDetails && (
                    <Row className="g-3"> {/* g-3 para gap */}
                        {renderDetail('ID', selectedEquipoDetails.id)}
                        {renderDetail('Nombre', selectedEquipoDetails.nombre)}
                        {renderDetail('Tipo', selectedEquipoDetails.tipo)}
                        {renderDetail('Ubicación', selectedEquipoDetails.ubicacion)}
                        {renderDetail('Marca', selectedEquipoDetails.marca)}
                        {renderDetail('Modelo', selectedEquipoDetails.modelo)}
                        {renderDetail('Serial', selectedEquipoDetails.serial)}
                        {renderDetail('Código Inventario', selectedEquipoDetails.codigo_inventario)}
                        {renderDetail('Fecha Instalación', formatDate(selectedEquipoDetails.fecha_instalacion))}
                        {renderDetail('Operativo', selectedEquipoDetails.estado_operativo)}
                        {renderDetail('Notas', selectedEquipoDetails.notas)}
                        {/* Opcional: mostrar fechas de creación/modificación */}
                        {/* {renderDetail('Fecha Creación', formatDate(selectedEquipoDetails.fecha_creacion))} */}
                        {/* {renderDetail('Última Modificación', formatDate(selectedEquipoDetails.ultima_modificacion))} */}
                    </Row>
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

export default OtrosEquiposViewModal;
