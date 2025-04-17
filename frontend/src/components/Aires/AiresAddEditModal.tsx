// src/components/Aires/AiresAddEditModal.tsx
import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert, Accordion } from 'react-bootstrap';
import { FiInfo, FiPackage, FiZap } from 'react-icons/fi';

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
interface AiresAddEditModalProps {
    show: boolean; // Controla la visibilidad del modal
    onHide: () => void; // Función para cerrar el modal
    modalTitle: string; // Título del modal ('Agregar' o 'Editar')
    formData: Partial<AireAcondicionado>; // Datos del formulario (usa la interfaz importada)
    formMode: 'add' | 'edit'; // Modo actual del formulario
    loadingEditDetails: boolean; // Indica si se están cargando detalles para editar
    editError: string | null; // Mensaje de error específico del modal (carga o submit)
    onSubmit: (e: React.FormEvent) => void; // Handler para enviar el formulario
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; // Handler para cambios en inputs
}

// Componente funcional del Modal
const AiresAddEditModal: React.FC<AiresAddEditModalProps> = ({
    show,
    onHide,
    modalTitle,
    formData, // <-- Prop ahora usa el tipo importado
    formMode,
    loadingEditDetails,
    editError,
    onSubmit,
    onChange
}) => {

    // Helper para manejar cambios en checkboxes (llama al onChange general)
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
    };

    return (
        // Componente Modal de react-bootstrap
        <Modal show={show} onHide={onHide} size="lg" centered> {/* Centrado y tamaño grande */}
            <Modal.Header closeButton>
                <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            {/* Formulario que maneja el envío */}
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    {/* Muestra errores específicos del modal */}
                    {editError && <Alert variant="danger">{editError}</Alert>}
                    {/* Muestra spinner si está cargando detalles en modo edición */}
                    {loadingEditDetails && formMode === 'edit' && (
                         <div className="text-center p-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 mb-0">Cargando detalles...</p>
                        </div>
                    )}

                    {/* Muestra el formulario si NO está cargando detalles O si está en modo 'add' */}
                    {(!loadingEditDetails || formMode === 'add') && (
                        // Acordeón para organizar las secciones del formulario
                        <Accordion defaultActiveKey={['0', '1', '2']} alwaysOpen>
                            {/* --- Sección: Información General --- */}
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><FiInfo className="me-2" /> Información General</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formNombreAire">
                                                <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="nombre"
                                                    value={formData.nombre || ''}
                                                    onChange={onChange}
                                                    required // Campo obligatorio HTML5
                                                    placeholder="Ej: Aire Sala Servidores 1"
                                                    autoFocus={formMode === 'add'} // Autofoco al agregar
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formUbicacionAire">
                                                <Form.Label>Ubicación <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="ubicacion"
                                                    value={formData.ubicacion || ''}
                                                    onChange={onChange}
                                                    required // Campo obligatorio HTML5
                                                    placeholder="Ej: Edificio A, Piso 3"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formFechaInstalacionAire">
                                                <Form.Label>Fecha de Instalación <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="fecha_instalacion"
                                                    value={formData.fecha_instalacion || ''} // Usa el valor formateado YYYY-MM-DD
                                                    onChange={onChange}
                                                    required // Campo obligatorio HTML5
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                             <Form.Group className="mb-3" controlId="formTipoAire">
                                                <Form.Label>Tipo</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="tipo"
                                                    value={formData.tipo || ''} // Maneja null/undefined
                                                    onChange={onChange}
                                                    placeholder="Ej: Precision, Confort"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3" controlId="formToneladasAire">
                                                <Form.Label>Toneladas</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="toneladas"
                                                    value={formData.toneladas ?? ''} // Usa '' para null/undefined en el input
                                                    onChange={onChange}
                                                    placeholder="Ej: 1.5"
                                                    step="0.1" // Permite decimales
                                                    min="0" // Valor mínimo
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* --- Sección: Unidad Evaporadora --- */}
                            <Accordion.Item eventKey="1">
                                <Accordion.Header><FiPackage className="me-2" /> Unidad Evaporadora</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3" controlId="formEvapMarca">
                                                <Form.Label>Marca</Form.Label>
                                                <Form.Control type="text" name="evaporadora_marca" value={formData.evaporadora_marca || ''} onChange={onChange} placeholder="Ej: Carrier" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3" controlId="formEvapModelo">
                                                <Form.Label>Modelo</Form.Label>
                                                <Form.Control type="text" name="evaporadora_modelo" value={formData.evaporadora_modelo || ''} onChange={onChange} placeholder="Ej: XPower" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3" controlId="formEvapSerial">
                                                <Form.Label>Serial <span className="text-danger">*</span></Form.Label>
                                                <Form.Control type="text" name="evaporadora_serial" value={formData.evaporadora_serial || ''} onChange={onChange} required placeholder="Ej: SN-EVAP123" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formEvapInventario">
                                                <Form.Label>Código Inventario <span className="text-danger">*</span></Form.Label>
                                                <Form.Control type="text" name="evaporadora_codigo_inventario" value={formData.evaporadora_codigo_inventario || ''} onChange={onChange} required placeholder="Ej: INV-EVAP456" />
                                            </Form.Group>
                                        </Col>
                                         <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formEvapUbicacion">
                                                <Form.Label>Ubicación Específica</Form.Label>
                                                <Form.Control type="text" name="evaporadora_ubicacion_instalacion" value={formData.evaporadora_ubicacion_instalacion || ''} onChange={onChange} placeholder="Ej: Dentro de Sala Servidores" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                     <Form.Group className="mb-3" controlId="formEvapOperativa">
                                        <Form.Check
                                            type="switch"
                                            id="evaporadora_operativa_switch"
                                            label="¿Evaporadora Operativa?"
                                            name="evaporadora_operativa"
                                            checked={!!formData.evaporadora_operativa} // Asegura que sea booleano
                                            onChange={handleCheckboxChange}
                                        />
                                    </Form.Group>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* --- Sección: Unidad Condensadora --- */}
                            <Accordion.Item eventKey="2">
                                <Accordion.Header><FiZap className="me-2" /> Unidad Condensadora</Accordion.Header>
                                <Accordion.Body>
                                     <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3" controlId="formCondMarca">
                                                <Form.Label>Marca</Form.Label>
                                                <Form.Control type="text" name="condensadora_marca" value={formData.condensadora_marca || ''} onChange={onChange} placeholder="Ej: LG" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3" controlId="formCondModelo">
                                                <Form.Label>Modelo</Form.Label>
                                                <Form.Control type="text" name="condensadora_modelo" value={formData.condensadora_modelo || ''} onChange={onChange} placeholder="Ej: Multi V" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3" controlId="formCondSerial">
                                                <Form.Label>Serial <span className="text-danger">*</span></Form.Label>
                                                <Form.Control type="text" name="condensadora_serial" value={formData.condensadora_serial || ''} onChange={onChange} required placeholder="Ej: SN-COND789" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formCondInventario">
                                                <Form.Label>Código Inventario <span className="text-danger">*</span></Form.Label>
                                                <Form.Control type="text" name="condensadora_codigo_inventario" value={formData.condensadora_codigo_inventario || ''} onChange={onChange} required placeholder="Ej: INV-COND012" />
                                            </Form.Group>
                                        </Col>
                                         <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formCondUbicacion">
                                                <Form.Label>Ubicación Específica</Form.Label>
                                                <Form.Control type="text" name="condensadora_ubicacion_instalacion" value={formData.condensadora_ubicacion_instalacion || ''} onChange={onChange} placeholder="Ej: Techo Edificio A" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                     <Form.Group className="mb-3" controlId="formCondOperativa">
                                        <Form.Check
                                            type="switch"
                                            id="condensadora_operativa_switch"
                                            label="¿Condensadora Operativa?"
                                            name="condensadora_operativa"
                                            checked={!!formData.condensadora_operativa} // Asegura que sea booleano
                                            onChange={handleCheckboxChange}
                                        />
                                    </Form.Group>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    )}
                </Modal.Body>
                <Modal.Footer>
                     {/* Botón Cancelar: deshabilita si está cargando detalles */}
                     <Button variant="secondary" onClick={onHide} disabled={loadingEditDetails && formMode === 'edit'}>
                        Cancelar
                    </Button>
                    {/* Botón Guardar: deshabilita si está cargando detalles */}
                    <Button variant="primary" type="submit" disabled={loadingEditDetails && formMode === 'edit'}>
                        {/* Podrías añadir un estado loadingSubmit para feedback en el botón */}
                        {formMode === 'add' ? 'Agregar Aire' : 'Guardar Cambios'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AiresAddEditModal;
