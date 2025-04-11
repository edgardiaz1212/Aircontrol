import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FiInfo, FiSettings } from 'react-icons/fi';

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

interface AiresAddEditModalProps {
    show: boolean;
    onHide: () => void;
    modalTitle: string;
    formData: Partial<AireAcondicionado>;
    formMode: 'add' | 'edit';
    loadingEditDetails: boolean;
    editError: string | null;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const AiresAddEditModal: React.FC<AiresAddEditModalProps> = ({
    show,
    onHide,
    modalTitle,
    formData,
    formMode,
    loadingEditDetails,
    editError,
    onSubmit,
    onChange
}) => {
    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    {/* Error specific to the edit modal */}
                    {editError && (
                        <Alert variant="danger">{editError}</Alert>
                    )}

                    {/* Loading indicator when fetching details for edit */}
                    {loadingEditDetails && formMode === 'edit' && (
                        <div className="text-center p-4">
                            <Spinner animation="border" variant="secondary" size="sm" />
                            <p className="mt-2 mb-0 small text-muted">Cargando detalles...</p>
                        </div>
                    )}

                    {/* Render form fields only when not loading details (or for 'add' mode) */}
                    {(!loadingEditDetails || formMode === 'add') && (
                        <Row>
                            {/* Columna 1: Datos Principales */}
                            <Col md={6}>
                                <h5><FiInfo className="me-2" /> Información Principal</h5>
                                <hr />
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre || ''}
                                        onChange={onChange}
                                        required
                                        placeholder="Ej: Aire Sala Servidores 1"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Ubicación *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ubicacion"
                                        value={formData.ubicacion || ''}
                                        onChange={onChange}
                                        required
                                        placeholder="Ej: Edificio A, Piso 3, Sala 301"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha de Instalación *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="fecha_instalacion"
                                        value={formData.fecha_instalacion || ''} // Should be YYYY-MM-DD
                                        onChange={onChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Estado</Form.Label>
                                    <Form.Select
                                        name="estado"
                                        value={formData.estado || 'Activo'} // Default to 'Activo' if undefined
                                        onChange={onChange}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        {/* Add other states if needed */}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Columna 2: Detalles Técnicos */}
                            <Col md={6}>
                                <h5><FiSettings className="me-2" /> Detalles Técnicos</h5>
                                <hr />
                                <Form.Group className="mb-3">
                                    <Form.Label>Marca</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="marca"
                                        value={formData.marca || ''}
                                        onChange={onChange}
                                        placeholder="Ej: Carrier"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Modelo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="modelo"
                                        value={formData.modelo || ''}
                                        onChange={onChange}
                                        placeholder="Ej: XPower Inverter"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Número de Serie</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="numero_serie"
                                        value={formData.numero_serie || ''}
                                        onChange={onChange}
                                        placeholder="Ej: SN-12345ABC"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Capacidad (BTU)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="capacidad_btu"
                                        value={formData.capacidad_btu ?? ''} // Use ?? '' to handle null/undefined for input value
                                        onChange={onChange}
                                        placeholder="Ej: 12000"
                                        step="100"
                                        min="0"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de Refrigerante</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="tipo_refrigerante"
                                        value={formData.tipo_refrigerante || ''}
                                        onChange={onChange}
                                        placeholder="Ej: R-410A"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Eficiencia Energética</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="eficiencia_energetica"
                                        value={formData.eficiencia_energetica || ''}
                                        onChange={onChange}
                                        placeholder="Ej: SEER 16"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha Último Mantenimiento</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="fecha_ultimo_mantenimiento"
                                        value={formData.fecha_ultimo_mantenimiento || ''} // Should be YYYY-MM-DD
                                        onChange={onChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Cancelar
                    </Button>
                    {/* Disable save button while loading details in edit mode */}
                    <Button variant="primary" type="submit" disabled={loadingEditDetails && formMode === 'edit'}>
                        Guardar
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AiresAddEditModal;
