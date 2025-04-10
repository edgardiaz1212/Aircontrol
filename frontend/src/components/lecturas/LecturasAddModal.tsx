import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';

// Reutilizamos interfaces
interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface FormData {
  aire_id: string;
  fecha: string;
  hora: string;
  temperatura: string;
  humedad: string;
}

interface LecturasAddModalProps {
  show: boolean;
  onHide: () => void;
  aires: AireAcondicionado[];
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>; // onSubmit ahora es async
  isSubmitting?: boolean; // Opcional: para deshabilitar botón mientras se envía
}

const LecturasAddModal: React.FC<LecturasAddModalProps> = ({
  show,
  onHide,
  aires,
  formData,
  onChange,
  onSubmit,
  isSubmitting = false // Valor por defecto
}) => {
  return (
    <Modal show={show} onHide={onHide} backdrop="static" keyboard={!isSubmitting}> {/* Evitar cerrar con backdrop/esc si está enviando */}
      <Modal.Header closeButton={!isSubmitting}> {/* Ocultar botón cerrar si está enviando */}
        <Modal.Title>Agregar Lectura</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Aire Acondicionado</Form.Label>
            <Form.Select
              name="aire_id"
              value={formData.aire_id}
              onChange={onChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Seleccione un aire acondicionado</option>
              {aires.map(aire => (
                <option key={aire.id} value={aire.id}>
                  {aire.nombre} - {aire.ubicacion}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={onChange}
                  required
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Hora</Form.Label>
                <Form.Control
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={onChange}
                  required
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Temperatura (°C)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1" // Permitir decimales
                  name="temperatura"
                  value={formData.temperatura}
                  onChange={onChange}
                  required
                  placeholder="Ej: 22.5"
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Humedad (%)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1" // Permitir decimales
                  name="humedad"
                  value={formData.humedad}
                  onChange={onChange}
                  required
                  placeholder="Ej: 55.0"
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LecturasAddModal;
