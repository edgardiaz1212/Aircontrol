// src/components/Aires/AiresAddEditModal.tsx
import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Alert, Accordion } from 'react-bootstrap'; // Añadir Accordion si lo usas
import { FiInfo, FiSettings, FiPackage, FiZap } from 'react-icons/fi'; // Añadir más iconos

// Asegúrate que la interfaz AireAcondicionado esté definida o importada aquí también
interface AireAcondicionado {
    id?: number; // ID es opcional al crear
    nombre?: string;
    ubicacion?: string;
    fecha_instalacion?: string;
    tipo?: string;
    toneladas?: number | null;
    evaporadora_operativa?: boolean;
    evaporadora_marca?: string;
    evaporadora_modelo?: string;
    evaporadora_serial?: string;
    evaporadora_codigo_inventario?: string;
    evaporadora_ubicacion_instalacion?: string;
    condensadora_operativa?: boolean;
    condensadora_marca?: string;
    condensadora_modelo?: string;
    condensadora_serial?: string;
    condensadora_codigo_inventario?: string;
    condensadora_ubicacion_instalacion?: string;
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
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; // Esta ya estaba
  }

interface AiresAddEditModalProps {
    // ... (props existentes)
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => void; // Asegurar que incluya Checkbox (HTMLInputElement)
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
    onChange // Asegúrate que la prop onChange acepte eventos de Checkbox
}) => {

    // Helper para manejar cambios en checkboxes
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        // Llama a la función onChange original pero pasando un evento simulado
        // o ajusta la función onChange en Aires.tsx para manejar 'checked'
        onChange({
            ...e, // Pasa el evento original
            target: {
                ...e.target,
                name,
                value: checked, // El valor para el estado es el booleano 'checked'
                type: 'checkbox', // Identifica que es un checkbox
            }
        } as any); // Usar 'as any' aquí es una solución rápida, idealmente ajusta el tipo en Aires.tsx
    };


    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    {/* ... (Error y Loading indicator) ... */}

                    {(!loadingEditDetails || formMode === 'add') && (
                        <Accordion defaultActiveKey={['0', '1']} alwaysOpen> {/* Usar Accordion para organizar */}
                            <Accordion.Item eventKey="0">
                                <Accordion.Header><FiInfo className="me-2" /> Información General</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Nombre *</Form.Label>
                                                <Form.Control type="text" name="nombre" value={formData.nombre || ''} onChange={onChange} required placeholder="Ej: Aire Sala Servidores 1" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ubicación *</Form.Label>
                                                <Form.Control type="text" name="ubicacion" value={formData.ubicacion || ''} onChange={onChange} required placeholder="Ej: Edificio A, Piso 3" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Fecha de Instalación *</Form.Label>
                                                <Form.Control type="date" name="fecha_instalacion" value={formData.fecha_instalacion || ''} onChange={onChange} required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                             <Form.Group className="mb-3">
                                                <Form.Label>Tipo</Form.Label>
                                                <Form.Control type="text" name="tipo" value={formData.tipo || ''} onChange={onChange} placeholder="Ej: Precision, Confort" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Toneladas</Form.Label>
                                                <Form.Control type="number" name="toneladas" value={formData.toneladas ?? ''} onChange={onChange} placeholder="Ej: 1.5" step="0.1" min="0" />
                                            </Form.Group>
                                        </Col>
                                        {/* Si mantienes 'estado', añádelo aquí */}
                                        {/* <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Estado</Form.Label>
                                                <Form.Select name="estado" value={formData.estado || 'Activo'} onChange={onChange}>
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                    <option value="Mantenimiento">Mantenimiento</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col> */}
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey="1">
                                <Accordion.Header><FiPackage className="me-2" /> Unidad Evaporadora</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Marca</Form.Label>
                                                <Form.Control type="text" name="evaporadora_marca" value={formData.evaporadora_marca || ''} onChange={onChange} placeholder="Ej: Carrier" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Modelo</Form.Label>
                                                <Form.Control type="text" name="evaporadora_modelo" value={formData.evaporadora_modelo || ''} onChange={onChange} placeholder="Ej: XPower" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Serial</Form.Label>
                                                <Form.Control type="text" name="evaporadora_serial" value={formData.evaporadora_serial || ''} onChange={onChange} placeholder="Ej: SN-EVAP123" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Código Inventario</Form.Label>
                                                <Form.Control type="text" name="evaporadora_codigo_inventario" value={formData.evaporadora_codigo_inventario || ''} onChange={onChange} placeholder="Ej: INV-EVAP456" />
                                            </Form.Group>
                                        </Col>
                                         <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ubicación Específica</Form.Label>
                                                <Form.Control type="text" name="evaporadora_ubicacion_instalacion" value={formData.evaporadora_ubicacion_instalacion || ''} onChange={onChange} placeholder="Ej: Dentro de Sala Servidores" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                     <Form.Group className="mb-3">
                                        <Form.Check
                                            type="switch"
                                            id="evaporadora_operativa_switch"
                                            label="¿Evaporadora Operativa?"
                                            name="evaporadora_operativa"
                                            checked={!!formData.evaporadora_operativa} // Asegura que sea booleano
                                            onChange={handleCheckboxChange} // Usa el handler específico
                                        />
                                    </Form.Group>
                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey="2">
                                <Accordion.Header><FiZap className="me-2" /> Unidad Condensadora</Accordion.Header>
                                <Accordion.Body>
                                     <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Marca</Form.Label>
                                                <Form.Control type="text" name="condensadora_marca" value={formData.condensadora_marca || ''} onChange={onChange} placeholder="Ej: LG" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Modelo</Form.Label>
                                                <Form.Control type="text" name="condensadora_modelo" value={formData.condensadora_modelo || ''} onChange={onChange} placeholder="Ej: Multi V" />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Serial</Form.Label>
                                                <Form.Control type="text" name="condensadora_serial" value={formData.condensadora_serial || ''} onChange={onChange} placeholder="Ej: SN-COND789" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Código Inventario</Form.Label>
                                                <Form.Control type="text" name="condensadora_codigo_inventario" value={formData.condensadora_codigo_inventario || ''} onChange={onChange} placeholder="Ej: INV-COND012" />
                                            </Form.Group>
                                        </Col>
                                         <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ubicación Específica</Form.Label>
                                                <Form.Control type="text" name="condensadora_ubicacion_instalacion" value={formData.condensadora_ubicacion_instalacion || ''} onChange={onChange} placeholder="Ej: Techo Edificio A" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                     <Form.Group className="mb-3">
                                        <Form.Check
                                            type="switch"
                                            id="condensadora_operativa_switch"
                                            label="¿Condensadora Operativa?"
                                            name="condensadora_operativa"
                                            checked={!!formData.condensadora_operativa} // Asegura que sea booleano
                                            onChange={handleCheckboxChange} // Usa el handler específico
                                        />
                                    </Form.Group>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* Añade más Accordion.Item si tienes otros grupos de campos */}

                        </Accordion>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {/* ... (Botones Cancelar y Guardar) ... */}
                     <Button variant="secondary" onClick={onHide}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={loadingEditDetails && formMode === 'edit'}>
                        Guardar
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AiresAddEditModal;
