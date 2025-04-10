import React from 'react';
import { Table, Spinner, Badge, Button } from 'react-bootstrap';
import { FiThermometer, FiDroplet, FiCalendar, FiClock, FiTrash2, FiPlus } from 'react-icons/fi';

// Reutilizamos la interfaz definida en Lecturas.tsx (o la movemos a un archivo types.ts)
interface Lectura {
  id: number;
  aire_id: number;
  fecha: string;
  temperatura: number;
  humedad: number;
  aire_nombre?: string;
  ubicacion?: string;
}

interface LecturasTableProps {
  lecturas: Lectura[];
  loading: boolean;
  canDelete: boolean;
  onDelete: (id: number) => void;
  onAdd: () => void; // Función para abrir el modal de agregar
  formatearFecha: (fechaStr: string) => string;
  formatearHora: (fechaStr: string) => string;
  umbrales: UmbralConfiguracion[]; 

}
interface UmbralConfiguracion { // O importar desde types.ts o Lecturas.tsx
  id: number;
  nombre: string;
  es_global: boolean;
  aire_id?: number | null;
  temp_min: number;
  temp_max: number;
  hum_min: number;
  hum_max: number;
  notificar_activo: boolean;
}

const LecturasTable: React.FC<LecturasTableProps> = ({
  lecturas,
  loading,
  canDelete,
  onDelete,
  onAdd,
  formatearFecha,
  formatearHora,
  umbrales
}) => {

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando lecturas...</p>
      </div>
    );
  }

  if (lecturas.length === 0) {
    return (
      <div className="text-center p-5">
        <div className="d-flex justify-content-center mb-3">
          <FiThermometer size={40} className="text-danger me-2" />
          <FiDroplet size={40} className="text-primary" />
        </div>
        <h4>No hay lecturas registradas</h4>
        <Button variant="primary" className="mt-3" onClick={onAdd}>
          <FiPlus className="me-2" /> Agregar primera lectura
        </Button>
      </div>
    );
  }

  

  return (
    <div className="table-responsive">
      <Table hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Aire Acondicionado</th>
            <th>Ubicación</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Temperatura</th>
            <th>Humedad</th>
            {canDelete && <th className="text-end">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {lecturas.map(lectura => {
            // --- Determinar umbral aplicable para ESTA lectura ---
            const umbralesActivos = umbrales.filter(u => u.notificar_activo);
            const umbralEspecifico = umbralesActivos.find(u => u.aire_id === lectura.aire_id);
            const umbralGlobal = umbralesActivos.find(u => u.es_global);

            // Prioridad: Específico > Global
            const umbralAplicable = umbralEspecifico || umbralGlobal;

            // --- Determinar color del badge de Temperatura ---
            let tempColor = 'success'; // Color por defecto si está dentro de límites o no hay umbral
            if (umbralAplicable) {
              if (lectura.temperatura < umbralAplicable.temp_min) {
                tempColor = 'info'; // Azul claro para frío
              } else if (lectura.temperatura > umbralAplicable.temp_max) {
                tempColor = 'danger'; // Rojo para caliente
              }
            } else {
              // Lógica fallback si NO hay umbrales (opcional, podrías usar los valores fijos aquí)
              if (lectura.temperatura > 25) tempColor = 'danger';
              if (lectura.temperatura < 18) tempColor = 'info';
            }

            // --- Determinar color del badge de Humedad ---
            let humColor = 'primary'; // Color por defecto
            if (umbralAplicable) {
              if (lectura.humedad < umbralAplicable.hum_min) {
                humColor = 'secondary'; // Gris/azul claro para seco
              } else if (lectura.humedad > umbralAplicable.hum_max) {
                humColor = 'warning'; // Naranja/amarillo para húmedo
              }
            } else {
              // Lógica fallback si NO hay umbrales (opcional)
              if (lectura.humedad > 70) humColor = 'warning';
              if (lectura.humedad < 30) humColor = 'secondary';
            }
            return (
            <tr key={lectura.id}>
              <td>{lectura.id}</td>
              <td>{lectura.aire_nombre}</td>
              <td>{lectura.ubicacion}</td>
              <td>
                <FiCalendar className="me-1" />
                {formatearFecha(lectura.fecha)}
              </td>
              <td>
                <FiClock className="me-1" />
                {formatearHora(lectura.fecha)}
              </td>
              <td>
                <Badge bg={tempColor}>
                  <FiThermometer className="me-1" />
                  {lectura.temperatura.toFixed(1)} °C {/* Asegurar formato */}
                </Badge>
              </td>
              <td>
                <Badge bg={humColor}>
                  <FiDroplet className="me-1" />
                  {lectura.humedad.toFixed(1)} % {/* Asegurar formato */}
                </Badge>
              </td>
              {canDelete && (
                <td className="text-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(lectura.id)}
                    title="Eliminar lectura" // Añadir tooltip
                  >
                    <FiTrash2 />
                  </Button>
                </td>
              )}
            </tr>
          )})}
        </tbody>
      </Table>
    </div>
  );
};

export default LecturasTable;
