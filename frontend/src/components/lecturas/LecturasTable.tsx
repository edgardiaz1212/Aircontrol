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
}

const LecturasTable: React.FC<LecturasTableProps> = ({
  lecturas,
  loading,
  canDelete,
  onDelete,
  onAdd,
  formatearFecha,
  formatearHora
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

  // Función para determinar el color del badge de temperatura
  const getTempBadgeColor = (temp: number): string => {
    if (temp > 25) return 'danger';
    if (temp < 18) return 'info';
    return 'success';
  };

  // Función para determinar el color del badge de humedad
  const getHumBadgeColor = (hum: number): string => {
    if (hum > 70) return 'warning';
    if (hum < 30) return 'secondary';
    return 'primary';
  };

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
          {lecturas.map(lectura => (
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
                <Badge bg={getTempBadgeColor(lectura.temperatura)}>
                  <FiThermometer className="me-1" />
                  {lectura.temperatura.toFixed(1)} °C {/* Asegurar formato */}
                </Badge>
              </td>
              <td>
                <Badge bg={getHumBadgeColor(lectura.humedad)}>
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
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default LecturasTable;
