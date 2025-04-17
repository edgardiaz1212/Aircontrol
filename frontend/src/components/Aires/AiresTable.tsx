// src/components/Aires/AiresTable.tsx
import React from 'react';
import { Table, Button, Spinner, Alert, Tooltip, OverlayTrigger } from 'react-bootstrap'; // Importar Tooltip y OverlayTrigger
import { FiEdit, FiTrash2, FiWind, FiPlus, FiInfo } from 'react-icons/fi'; // Importar FiInfo

// --- IMPORTAR LA INTERFAZ DESDE EL PADRE ---
// Ajusta la ruta relativa si es necesario para apuntar a src/pages/Aires.tsx
import { AireAcondicionadoListItem } from '../../pages/Aires';

// --- ELIMINAR LA DEFINICIÓN INLINE (si existía) ---
/*
interface AireAcondicionadoListItem { // <-- BORRAR
    id: number;
    nombre: string;
    ubicacion: string;
    fecha_instalacion: string;
}
*/

// Interfaz de las props de la tabla
interface AiresTableProps {
    airesList: AireAcondicionadoListItem[]; // <-- Usa la interfaz importada
    loading: boolean; // Indica si la lista está cargando
    error: string | null; // Mensaje de error general (se muestra en el padre)
    canManage: boolean; // Indica si el usuario puede editar/eliminar
    onRowClick: (id: number) => void; // Handler para clic en fila (ver detalles)
    onEdit: (aire: AireAcondicionadoListItem) => void; // Handler para botón editar (usa la interfaz importada)
    onDelete: (id: number) => void; // Handler para botón eliminar
    onAdd: () => void; // Handler para botón agregar en estado vacío
    formatDate: (dateString: string | null | undefined, forInput?: boolean) => string; // Helper para formatear fechas
}

// Componente funcional de la Tabla
const AiresTable: React.FC<AiresTableProps> = ({
    airesList, // <-- Prop ahora usa el tipo importado
    loading,
    error, // Error general no se muestra aquí directamente
    canManage,
    onRowClick,
    onEdit,
    onDelete,
    onAdd,
    formatDate
}) => {

    // Muestra spinner mientras carga
    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando aires acondicionados...</p>
            </div>
        );
    }

    // El error general se maneja en el componente padre (Aires.tsx)
    // if (error) { return null; } // No mostrar nada si hay error general

    // Muestra mensaje y botón de agregar si la lista está vacía (y no hay error)
    if (!error && airesList.length === 0) {
        return (
            <div className="text-center p-5">
                <FiWind size={50} className="text-muted mb-3" />
                <h4>No hay aires acondicionados registrados</h4>
                {/* Botón para agregar el primer aire, solo si tiene permisos */}
                {canManage && (
                    <Button variant="primary" className="mt-3" onClick={onAdd}>
                        <FiPlus className="me-2" /> Agregar primer aire
                    </Button>
                )}
            </div>
        );
    }

    // Helper para renderizar Tooltips en botones
    const renderTooltip = (props: any, text: string) => (
        <Tooltip id={`tooltip-${text.replace(/\s+/g, '-')}`} {...props}>
          {text}
        </Tooltip>
      );

    // Renderiza la tabla si hay datos
    return (
        <div className="table-responsive">
            <Table hover className="table-clickable aires-table"> {/* Añadir clase para posible estilo específico */}
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Ubicación</th>
                        <th>Fecha de Instalación</th>
                        {/* Columna de acciones solo si tiene permisos */}
                        {canManage && <th className="text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {/* Mapea la lista de aires para crear las filas */}
                    {airesList.map((aire: AireAcondicionadoListItem) => ( // <-- Usa el tipo importado
                        <tr
                            key={aire.id}
                            onClick={() => onRowClick(aire.id)} // Clic en fila abre detalles
                            style={{ cursor: 'pointer' }}
                            title="Ver detalles del aire" // Tooltip para la fila
                        >
                            <td>{aire.nombre}</td>
                            <td>{aire.ubicacion}</td>
                            {/* Formatea la fecha para mostrarla */}
                            <td>{formatDate(aire.fecha_instalacion)}</td>
                            {/* Celda de acciones solo si tiene permisos */}
                            {canManage && (
                                <td className="text-end" onClick={(e) => e.stopPropagation()}> {/* Evita que clic en botones active clic en fila */}
                                    {/* Botón Ver Detalles (opcional, ya que la fila es clickeable) */}
                                    <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Ver Detalles')}>
                                        <Button
                                            variant="outline-secondary" // Cambiado a secundario
                                            size="sm"
                                            className="me-2"
                                            onClick={() => onRowClick(aire.id)} // Llama a la misma función que el clic en fila
                                        >
                                            <FiInfo />
                                        </Button>
                                    </OverlayTrigger>
                                    {/* Botón Editar */}
                                    <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Editar')}>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => onEdit(aire)} // Pasa el objeto 'aire' completo
                                        >
                                            <FiEdit />
                                        </Button>
                                    </OverlayTrigger>
                                    {/* Botón Eliminar */}
                                    <OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Eliminar')}>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => onDelete(aire.id)} // Pasa solo el ID
                                        >
                                            <FiTrash2 />
                                        </Button>
                                    </OverlayTrigger>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default AiresTable;
