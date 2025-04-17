// src/components/Aires/AiresViewModal.tsx
import React from 'react';
import { Modal, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';

// --- IMPORTAR LA INTERFAZ DESDE EL PADRE ---
// Ajusta la ruta relativa si es necesario para apuntar a src/pages/Aires.tsx
import { AireAcondicionado } from '../../pages/Aires';

// --- ELIMINAR LA DEFINICIÓN INLINE (si existía) ---
/*
interface AireAcondicionado { // <-- BORRAR ESTA DEFINICIÓN LOCAL
    // ... campos ...
}
*/

// Interfaz de las props del modal
interface AiresViewModalProps {
    show: boolean; // Controla la visibilidad del modal
    onHide: () => void; // Función para cerrar el modal
    selectedAireDetails: AireAcondicionado | null; // Datos del aire a mostrar (usa la interfaz importada)
    loadingDetails: boolean; // Indica si se están cargando los detalles
    viewError: string | null; // Mensaje de error específico de este modal
    formatDate: (dateString: string | null | undefined, forInput?: boolean) => string; // Helper para formatear fechas
}

// Componente funcional del Modal de Vista
const AiresViewModal: React.FC<AiresViewModalProps> = ({
    show,
    onHide,
    selectedAireDetails, // <-- Prop ahora usa el tipo importado
    loadingDetails,
    viewError,
    formatDate,
}) => {

    // Helper para renderizar un par etiqueta-valor
    const renderDetail = (label: string, value: string | number | boolean | null | undefined) => {
        let displayValue: React.ReactNode = '-'; // Valor por defecto si es null, undefined o vacío

        // Formatear el valor para mostrarlo
        if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'boolean') {
                // Mostrar como badge Sí/No para booleanos
                displayValue = (
                    <span className={`badge bg-${value ? 'success' : 'danger'}`}>
                        {value ? 'Sí' : 'No'}
                    </span>
                );
            } else if (typeof value === 'number' && isNaN(value)) {
                // Manejar NaN específicamente si es necesario (ej. toneladas)
                displayValue = '-';
            }
             else {
                // Convertir a string para otros tipos (números, strings)
                displayValue = value.toString();
            }
        }

        // Devolver la estructura de columnas para el detalle
        return (
            <React.Fragment key={label}> {/* Usar Fragment con key para listas implícitas */}
                <Col xs={5} sm={4} className="text-muted fw-bold">{label}:</Col>
                <Col xs={7} sm={8}>{displayValue}</Col>
            </React.Fragment>
        );
    };

    return (
        // Componente Modal de react-bootstrap
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Detalles del Aire Acondicionado</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Mostrar error si existe */}
                {viewError && <Alert variant="danger">{viewError}</Alert>}
                {/* Mostrar spinner si está cargando */}
                {loadingDetails && (
                    <div className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 mb-0">Cargando detalles...</p>
                    </div>
                )}
                {/* Mostrar detalles si NO está cargando y HAY datos */}
                {selectedAireDetails && !loadingDetails && (
                    <Row className="g-3"> {/* g-3 añade espacio entre columnas */}
                        {/* Información General */}
                        {renderDetail('ID', selectedAireDetails.id)}
                        {renderDetail('Nombre', selectedAireDetails.nombre)}
                        {renderDetail('Ubicación', selectedAireDetails.ubicacion)}
                        {renderDetail('Fecha Instalación', formatDate(selectedAireDetails.fecha_instalacion))}
                        {renderDetail('Tipo', selectedAireDetails.tipo)}
                        {renderDetail('Toneladas', selectedAireDetails.toneladas)}

                        {/* Separador */}
                        <Col xs={12}><hr className="my-3" /></Col>

                        {/* Detalles Evaporadora */}
                        <Col xs={12}><h6 className="text-primary mb-2">Unidad Evaporadora</h6></Col>
                        {renderDetail('Operativa', selectedAireDetails.evaporadora_operativa)}
                        {renderDetail('Marca', selectedAireDetails.evaporadora_marca)}
                        {renderDetail('Modelo', selectedAireDetails.evaporadora_modelo)}
                        {renderDetail('Serial', selectedAireDetails.evaporadora_serial)}
                        {renderDetail('Cód. Inventario', selectedAireDetails.evaporadora_codigo_inventario)}
                        {renderDetail('Ubic. Específica', selectedAireDetails.evaporadora_ubicacion_instalacion)}

                        {/* Separador */}
                         <Col xs={12}><hr className="my-3" /></Col>

                        {/* Detalles Condensadora */}
                        <Col xs={12}><h6 className="text-primary mb-2">Unidad Condensadora</h6></Col>
                        {renderDetail('Operativa', selectedAireDetails.condensadora_operativa)}
                        {renderDetail('Marca', selectedAireDetails.condensadora_marca)}
                        {renderDetail('Modelo', selectedAireDetails.condensadora_modelo)}
                        {renderDetail('Serial', selectedAireDetails.condensadora_serial)}
                        {renderDetail('Cód. Inventario', selectedAireDetails.condensadora_codigo_inventario)}
                        {renderDetail('Ubic. Específica', selectedAireDetails.condensadora_ubicacion_instalacion)}
                    </Row>
                )}
                {/* Mensaje si no hay detalles (por si acaso) */}
                {!selectedAireDetails && !loadingDetails && !viewError && (
                     <p className="text-center text-muted">No hay detalles para mostrar.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                {/* Botón para cerrar el modal */}
                <Button variant="secondary" onClick={onHide}>
                    Cerrar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AiresViewModal;
