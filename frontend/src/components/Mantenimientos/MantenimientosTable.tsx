import React from "react";
import { Table, Button, Badge, Spinner } from "react-bootstrap";
import {
  FiTrash2,
  FiImage,
  FiCalendar,
  FiUser,
  FiTool,
  FiInfo, // Added for the explicit view button
} from "react-icons/fi";

// Reutiliza o importa la interfaz Mantenimiento
interface Mantenimiento {
  id: number;
  aire_id: number;
  fecha: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
  imagen?: string;
  tiene_imagen: boolean;
  aire_nombre?: string;
  ubicacion?: string;
}

interface MantenimientosTableProps {
  mantenimientos: Mantenimiento[];
  loading: boolean;
  canEdit: boolean;
  onShowViewModal: (mantenimiento: Mantenimiento) => void;
  onShowImagen: (id: number) => void
  onDelete: (id: number) => void;
  getBadgeColor: (tipo: string | undefined) => string;
  formatearFechaHora: (fechaStr: string | undefined) => string;
}

const MantenimientosTable: React.FC<MantenimientosTableProps> = ({
  mantenimientos,
  loading,
  canEdit,
  onShowViewModal,
  onShowImagen,
  onDelete,
  getBadgeColor,
  formatearFechaHora,
}) => {
  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando registros de mantenimiento...</p>
      </div>
    );
  }

  if (mantenimientos.length === 0) {
    // El mensaje de "No hay registros" y el botón de agregar se manejarán en el componente padre
    // para tener acceso a la función handleAdd y al filtro actual.
    // Aquí podríamos retornar un mensaje simple o null.
    return null;
    // Opcionalmente, un mensaje simple:
    // return <p className="text-center text-muted p-4">No se encontraron registros.</p>;
  }

  return (
    <div className="table-responsive">
      <Table hover className="mantenimientos-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Aire Acondicionado</th>
            <th>Ubicación</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Técnico</th>
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((mantenimiento) => (
            <tr
              key={mantenimiento.id}
              onClick={() => onShowViewModal(mantenimiento)}
              style={{ cursor: "pointer" }}
            >
              <td>{mantenimiento.id}</td>
              <td>{mantenimiento.aire_nombre}</td>
              <td>{mantenimiento.ubicacion}</td>
              <td>
                <FiCalendar className="me-1" />
                {formatearFechaHora(mantenimiento.fecha).split(" ")[0]}{" "}
                {/* Show only date part */}
              </td>
              <td>
                <Badge bg={getBadgeColor(mantenimiento.tipo_mantenimiento)}>
                  {mantenimiento.tipo_mantenimiento}
                </Badge>
              </td>
              <td>
                <FiUser className="me-1" />
                {mantenimiento.tecnico}
              </td>
              
              <td className="text-end">
                {/* Botón explícito para ver detalles (opcional, ya que el clic en fila funciona) */}
                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        onShowViewModal(mantenimiento);
                    }}
                    title="Ver Detalles"
                 >
                    <FiInfo />
                 </Button>
                 {mantenimiento.tiene_imagen && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="ms-2"
                    // Pasar el ID del mantenimiento al hacer clic
                    onClick={() => onShowImagen(mantenimiento.id)}
                    title="Ver imagen adjunta"
                  >
                    <FiImage />
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      onDelete(mantenimiento.id);
                    }}
                    title="Eliminar Mantenimiento"
                  >
                    <FiTrash2 />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default MantenimientosTable;
