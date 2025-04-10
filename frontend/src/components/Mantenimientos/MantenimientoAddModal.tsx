import React, { useRef } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { FiPlus } from "react-icons/fi";

// Interfaz para los datos del formulario
interface MantenimientoFormData {
  aire_id: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
}

// Interfaz para los aires (simplificada, solo lo necesario para el select)
interface AireAcondicionadoOption {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface MantenimientoAddModalProps {
  show: boolean;
  onHide: () => void;
  aires: AireAcondicionadoOption[];
  formData: MantenimientoFormData;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>; // onSubmit es ahora async
}

const MantenimientoAddModal: React.FC<MantenimientoAddModalProps> = ({
  show,
  onHide,
  aires,
  formData,
  fileInputRef,
  onChange,
  onSubmit,
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FiPlus className="me-2" /> Registrar Mantenimiento
        </Modal.Title>
      </Modal.Header>
      {/* El Form ahora llama directamente a la prop onSubmit */}
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Aire Acondicionado</Form.Label>
            <Form.Select
              name="aire_id"
              value={formData.aire_id}
              onChange={onChange} // Usa la prop onChange
              required
            >
              <option value="">Seleccione un aire acondicionado</option>
              {aires.map((aire) => (
                <option key={aire.id} value={aire.id}>
                  {aire.nombre} - {aire.ubicacion}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tipo de Mantenimiento</Form.Label>
            <Form.Select
              name="tipo_mantenimiento"
              value={formData.tipo_mantenimiento}
              onChange={onChange} // Usa la prop onChange
              required
            >
              <option value="">Seleccione un tipo</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Correctivo">Correctivo</option>
              <option value="Predictivo">Predictivo</option>
              <option value="Instalación">Instalación</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Otros">Otros</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formData.descripcion}
              onChange={onChange} // Usa la prop onChange
              required
              placeholder="Detalle las tareas realizadas..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Técnico Responsable</Form.Label>
            <Form.Control
              type="text"
              name="tecnico"
              value={formData.tecnico}
              onChange={onChange} // Usa la prop onChange
              required
              placeholder="Nombre del técnico"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Imagen (opcional)</Form.Label>
            {/* Pasa la ref directamente */}
            <Form.Control type="file" ref={fileInputRef} accept="image/*" />
            <Form.Text className="text-muted">
              Suba una imagen relacionada al mantenimiento (ej: antes/después,
              pieza cambiada).
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar Registro
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MantenimientoAddModal;
