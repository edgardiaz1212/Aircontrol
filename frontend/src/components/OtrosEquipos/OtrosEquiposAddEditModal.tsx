// src/components/OtrosEquipos/OtrosEquiposAddEditModal.tsx
import React from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';

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
}

interface OtrosEquiposAddEditModalProps {
    show: boolean;
    onHide: () => void;
    modalTitle: string;
    formData: Partial<OtroEquipo>;
    formMode: 'add' | 'edit';
    loadingEditDetails: boolean; // Para mostrar spinner al cargar para editar
    editError: string | null; // Errores específicos del modal (carga o submit)
    onSubmit: (e: React.FormEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const OtrosEquiposAddEditModal: React.FC<OtrosEquiposAddEditModalProps> = ({
    show,
    onHide,
    modalTitle,
    formData,
    formMode,
    loadingEditDetails,
    editError,
    onSubmit,
    onChange,
}) => {

    const tiposPermitidos: OtroEquipo['tipo'][] = ['Motogenerador', 'UPS', 'PDU', 'Otro'];

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    {editError && <Alert variant="danger">{editError}</Alert>}

                    {loadingEditDetails ? (
                        <div className="text-center">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Cargando detalles...</p>
                        </div>
                    ) : (
                        <Row>
                            {/* Columna 1 */}
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formNombreEquipo">
                                    <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre || ''}
                                        onChange={onChange}
                                        required
                                        autoFocus={formMode === 'add'}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formTipoEquipo">
                                    <Form.Label>Tipo <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="tipo"
                                        value={formData.tipo || 'Otro'}
                                        onChange={onChange}
                                        required
                                    >
                                        {tiposPermitidos.map(tipo => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formUbicacionEquipo">
                                    <Form.Label>Ubicación</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ubicacion"
                                        value={formData.ubicacion || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formMarcaEquipo">
                                    <Form.Label>Marca</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="marca"
                                        value={formData.marca || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formModeloEquipo">
                                    <Form.Label>Modelo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="modelo"
                                        value={formData.modelo || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Columna 2 */}
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formSerialEquipo">
                                    <Form.Label>Serial</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="serial"
                                        value={formData.serial || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formCodigoInventarioEquipo">
                                    <Form.Label>Código Inventario</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="codigo_inventario"
                                        value={formData.codigo_inventario || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formFechaInstalacionEquipo">
                                    <Form.Label>Fecha Instalación</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="fecha_instalacion"
                                        value={formData.fecha_instalacion || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formEstadoOperativoEquipo">
                                    <Form.Check
                                        type="checkbox"
                                        label="Equipo Operativo"
                                        name="estado_operativo"
                                        checked={formData.estado_operativo ?? true}
                                        onChange={onChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formNotasEquipo">
                                    <Form.Label>Notas Adicionales</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="notas"
                                        value={formData.notas || ''}
                                        onChange={onChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loadingEditDetails}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loadingEditDetails}>
                        {formMode === 'add' ? 'Agregar Equipo' : 'Guardar Cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default OtrosEquiposAddEditModal;
