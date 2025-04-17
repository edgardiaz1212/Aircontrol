// src/components/Mantenimientos/MantenimientoAddModal.tsx
import React, { useState, useEffect } from 'react'; // Añadir useState, useEffect
import { Modal, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap'; // Añadir Row, Col

// --- IMPORTAR TIPOS DESDE EL PADRE ---
import { AireAcondicionadoOption, OtroEquipoOption } from '../../pages/Mantenimientos'; // Importar ambos

// Interfaz FormData (puede quedarse aquí)
interface MantenimientoFormData {
  aire_id: string;
  otro_equipo_id: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
}

interface MantenimientoAddModalProps {
  show: boolean;
  onHide: () => void;
  aires: AireAcondicionadoOption[];
  otrosEquipos: OtroEquipoOption[]; // <-- NUEVA PROP
  formData: MantenimientoFormData;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loadingSubmit: boolean;
  error: string | null;
  clearError: () => void;
}

// --- DEFINIR LOS TIPOS DE MANTENIMIENTO ---
// Puedes ajustar esta lista según tus necesidades
const tiposMantenimientoDisponibles = [
  "Preventivo",
  "Correctivo",
  "Predictivo",
  "Mejora",
  "Inspección",
  "Limpieza General",
  "Otro", // Opción genérica
];


const MantenimientoAddModal: React.FC<MantenimientoAddModalProps> = ({
  show,
  onHide,
  aires,
  otrosEquipos, // <-- Recibir prop
  formData,
  fileInputRef,
  onChange,
  onSubmit,
  loadingSubmit,
  error,
  clearError,
}) => {

  // Estado local para manejar qué tipo de equipo está seleccionado
  const [selectedEquipoType, setSelectedEquipoType] = useState<'aire' | 'otro'>('aire');

  // Efecto para resetear el tipo seleccionado cuando se abre el modal
  // y seleccionar 'aire' si hay aires disponibles, o 'otro' si no.
  useEffect(() => {
    if (show) {
        const defaultType = aires.length > 0 ? 'aire' : (otrosEquipos.length > 0 ? 'otro' : 'aire');
        setSelectedEquipoType(defaultType);
        // Asegurar que el formData refleje el tipo inicial (esto ya lo hace handleAdd en el padre)
    }
  }, [show, aires, otrosEquipos]);


  const handleHide = () => {
    clearError();
    onHide();
  };

  // Handler para el cambio de TIPO de equipo
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as 'aire' | 'otro';
    setSelectedEquipoType(newType);

    // Limpiar el ID del tipo NO seleccionado y seleccionar el primero del nuevo tipo si existe
    const firstAireId = aires.length > 0 ? aires[0].id.toString() : "";
    const firstOtroId = otrosEquipos.length > 0 ? otrosEquipos[0].id.toString() : "";

    // Simular eventos de cambio para actualizar el formData en el padre
    const fakeAireEvent = { target: { name: 'aire_id', value: newType === 'aire' ? firstAireId : "" } } as React.ChangeEvent<HTMLSelectElement>;
    const fakeOtroEvent = { target: { name: 'otro_equipo_id', value: newType === 'otro' ? firstOtroId : "" } } as React.ChangeEvent<HTMLSelectElement>;

    onChange(fakeAireEvent);
    onChange(fakeOtroEvent);
  };


  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Registrar Nuevo Mantenimiento</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* --- Selector de Tipo de Equipo --- */}
          <Form.Group className="mb-3" controlId="formTipoEquipoSelector">
             <Form.Label>Tipo de Equipo <span className="text-danger">*</span></Form.Label>
             <div>
                <Form.Check
                    inline
                    type="radio"
                    label="Aire Acondicionado"
                    name="tipoEquipoSelector"
                    id="tipo-aire"
                    value="aire"
                    checked={selectedEquipoType === 'aire'}
                    onChange={handleTypeChange}
                    disabled={aires.length === 0} // Deshabilitar si no hay aires
                />
                <Form.Check
                    inline
                    type="radio"
                    label="Otro Equipo"
                    name="tipoEquipoSelector"
                    id="tipo-otro"
                    value="otro"
                    checked={selectedEquipoType === 'otro'}
                    onChange={handleTypeChange}
                    disabled={otrosEquipos.length === 0} // Deshabilitar si no hay otros
                />
             </div>
          </Form.Group>

          {/* --- Selector Condicional para Aires --- */}
          {selectedEquipoType === 'aire' && (
            <Form.Group className="mb-3" controlId="formAireMantenimiento">
              <Form.Label>Aire Acondicionado <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="aire_id" // El name coincide con la key en formData
                value={formData.aire_id} // Usa el valor de formData
                onChange={onChange} // Usa el handler del padre
                required // Hacer requerido si este selector está visible
                disabled={aires.length === 0}
              >
                {aires.length === 0 ? (
                    <option value="">No hay aires disponibles</option>
                ) : (
                    // Añadir opción "Seleccione..." si se prefiere
                    // <option value="">-- Seleccione un Aire --</option>
                    aires.map((aire) => (
                        <option key={aire.id} value={aire.id.toString()}>
                        {aire.nombre} - {aire.ubicacion}
                        </option>
                    ))
                )}
              </Form.Select>
            </Form.Group>
          )}

          {/* --- Selector Condicional para Otros Equipos --- */}
          {selectedEquipoType === 'otro' && (
            <Form.Group className="mb-3" controlId="formOtroEquipoMantenimiento">
              <Form.Label>Otro Equipo <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="otro_equipo_id" // El name coincide con la key en formData
                value={formData.otro_equipo_id} // Usa el valor de formData
                onChange={onChange} // Usa el handler del padre
                required // Hacer requerido si este selector está visible
                disabled={otrosEquipos.length === 0}
              >
                 {otrosEquipos.length === 0 ? (
                    <option value="">No hay otros equipos disponibles</option>
                 ) : (
                    // <option value="">-- Seleccione Otro Equipo --</option>
                    otrosEquipos.map((otro) => (
                        <option key={otro.id} value={otro.id.toString()}>
                        {otro.nombre} ({otro.tipo})
                        </option>
                    ))
                 )}
              </Form.Select>
            </Form.Group>
          )}

          {/* --- Resto de los campos del formulario (sin cambios) --- */}
          <Form.Group className="mb-3" controlId="formTipoMantenimiento">
            <Form.Label>Tipo de Mantenimiento <span className="text-danger">*</span></Form.Label>
            <Form.Select
                name="tipo_mantenimiento"
                value={formData.tipo_mantenimiento}
                onChange={onChange}
                required
            >
                <option value="">-- Seleccione un Tipo --</option>
                {tiposMantenimientoDisponibles.map((tipo) => (
                    <option key={tipo} value={tipo}>
                        {tipo}
                    </option>
                ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formTecnicoMantenimiento">
            <Form.Label>Técnico Responsable <span className="text-danger">*</span></Form.Label>
            <Form.Control type="text" name="tecnico" value={formData.tecnico} onChange={onChange} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formDescripcionMantenimiento">
            <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
            <Form.Control as="textarea" rows={3} name="descripcion" value={formData.descripcion} onChange={onChange} required />
          </Form.Group>
          <Form.Group controlId="formImagenMantenimiento" className="mb-3">
            <Form.Label>Adjuntar Imagen (Opcional)</Form.Label>
            <Form.Control type="file" name="imagen_file" ref={fileInputRef} accept="image/*" />
          </Form.Group>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide} disabled={loadingSubmit}> Cancelar </Button>
          <Button variant="primary" type="submit" disabled={loadingSubmit}>
            {loadingSubmit ? <><Spinner size="sm"/> Guardando...</> : 'Guardar Mantenimiento'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MantenimientoAddModal;
