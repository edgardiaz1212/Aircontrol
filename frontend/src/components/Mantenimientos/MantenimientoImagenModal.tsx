import React from "react";
import { Modal, Button, Image } from "react-bootstrap";

interface MantenimientoImagenModalProps {
  show: boolean;
  onHide: () => void;
  imagenUrl: string | null; // Puede ser null si no hay imagen seleccionada
}

const MantenimientoImagenModal: React.FC<MantenimientoImagenModalProps> = ({
  show,
  onHide,
  imagenUrl,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Imagen de Mantenimiento</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {imagenUrl ? (
          // Limita la altura máxima para evitar que sea demasiado grande
          <Image src={imagenUrl} fluid style={{ maxHeight: "80vh" }} />
        ) : (
          <p>No se pudo cargar la imagen.</p>
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

export default MantenimientoImagenModal;
