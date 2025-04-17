// src/components/Mantenimientos/MantenimientosTable.tsx
import React from "react";
import { Table, Button, Badge, Spinner, Tooltip, OverlayTrigger } from "react-bootstrap"; // Added Tooltip, OverlayTrigger
import {
  FiTrash2,
  FiImage,
  FiCalendar,
  FiUser,
  FiTool, // Keep FiTool or use FiTag for Type
  FiInfo,
  FiPackage, // Icon for Equipment Name
  FiMapPin,  // Icon for Equipment Location
} from "react-icons/fi";

// --- IMPORTAR TIPOS DESDE EL PADRE ---
// Asegúrate que la ruta relativa sea correcta desde este archivo
// hasta src/pages/Mantenimientos.tsx
import { Mantenimiento } from '../../pages/Mantenimientos';

interface MantenimientosTableProps {
  mantenimientos: Mantenimiento[];
  loading: boolean;
  canEdit: boolean;
  onShowViewModal: (mantenimiento: Mantenimiento) => void;
  onShowImagen: (id: number) => void;
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

  // El estado vacío se maneja en el componente padre

  // Helper para renderizar Tooltips en botones
  const renderTooltip = (props: any, text: string) => (
    <Tooltip id={`button-tooltip-${text.replace(/\s+/g, '-')}`} {...props}>
      {text}
    </Tooltip>
  );

  return (
    <div className="table-responsive">
      <Table hover className="mantenimientos-table">
        <thead>
          <tr>
            {/* Columnas ajustadas según lo solicitado */}
            <th><FiUser className="me-1" />Técnico</th>
            <th><FiPackage className="me-1" />Equipo</th>
            <th><FiMapPin className="me-1" />Ubicación Equipo</th>
            <th><FiCalendar className="me-1" />Fecha</th>
            <th><FiTool className="me-1" />Tipo</th>
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mantenimientos.map((mantenimiento: Mantenimiento) => (
            <tr
              key={mantenimiento.id}
              onClick={() => onShowViewModal(mantenimiento)} // Clic en fila abre detalles
              style={{ cursor: "pointer" }}
              title="Ver detalles del mantenimiento" // Tooltip para la fila
            >
              {/* Celdas de datos ajustadas */}
              <td>
                {mantenimiento.tecnico || '-'}
              </td>
              <td>
                {mantenimiento.equipo_nombre || 'N/A'}
              </td>
              <td>
                {mantenimiento.equipo_ubicacion || 'N/A'}
              </td>
              <td>
                {/* Mostrar solo la fecha por defecto para limpieza */}
                {formatearFechaHora(mantenimiento.fecha).split(" ")[0]}
              </td>
              <td>
                <Badge bg={getBadgeColor(mantenimiento.tipo_mantenimiento)} pill> {/* Usar pill para badges */}
                  {mantenimiento.tipo_mantenimiento}
                </Badge>
              </td>
              <td className="text-end" onClick={(e) => e.stopPropagation()}> {/* Evitar que clic en botones active clic en fila */}

                {/* Botón explícito para ver detalles */}
                 <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => renderTooltip(props, "Ver Detalles")}
                 >
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => onShowViewModal(mantenimiento)}
                    >
                        <FiInfo />
                    </Button>
                 </OverlayTrigger>

                 {/* Botón para ver imagen */}
                 {mantenimiento.tiene_imagen && (
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => renderTooltip(props, "Ver Imagen")}
                  >
                    <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => onShowImagen(mantenimiento.id)}
                    >
                        <FiImage />
                    </Button>
                  </OverlayTrigger>
                )}

                {/* Botón para eliminar */}
                {canEdit && (
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={(props) => renderTooltip(props, "Eliminar")}
                  >
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDelete(mantenimiento.id)}
                    >
                        <FiTrash2 />
                    </Button>
                  </OverlayTrigger>
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
