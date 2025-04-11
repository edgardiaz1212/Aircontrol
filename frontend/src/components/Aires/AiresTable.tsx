import React from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FiEdit, FiTrash2, FiWind, FiPlus } from 'react-icons/fi';

// Reutilizamos las interfaces definidas en el componente padre o las movemos a un archivo types.ts
interface AireAcondicionadoListItem {
    id: number;
    nombre: string;
    ubicacion: string;
    fecha_instalacion: string;
}

interface AiresTableProps {
    airesList: AireAcondicionadoListItem[];
    loading: boolean;
    error: string | null;
    canManage: boolean;
    onRowClick: (id: number) => void;
    onEdit: (aire: AireAcondicionadoListItem) => void;
    onDelete: (id: number) => void;
    onAdd: () => void; // Para el botón en estado vacío
    formatDate: (dateString: string | null | undefined, forInput?: boolean) => string;
}

const AiresTable: React.FC<AiresTableProps> = ({
    airesList,
    loading,
    error,
    canManage,
    onRowClick,
    onEdit,
    onDelete,
    onAdd,
    formatDate
}) => {

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando aires acondicionados...</p>
            </div>
        );
    }

    if (error) {
        // El error general se muestra en el componente padre, aquí podríamos mostrar un error específico de tabla si fuera necesario
        return null; // O un mensaje específico si se prefiere
    }

    if (airesList.length === 0) {
        return (
            <div className="text-center p-5">
                <FiWind size={50} className="text-muted mb-3" />
                <h4>No hay aires acondicionados registrados</h4>
                {canManage && (
                    <Button variant="primary" className="mt-3" onClick={onAdd}>
                        <FiPlus className="me-2" /> Agregar primer aire
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <Table hover className="table-clickable">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Ubicación</th>
                        <th>Fecha de Instalación</th>
                        {canManage && <th className="text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {airesList.map(aire => (
                        <tr key={aire.id} onClick={() => onRowClick(aire.id)} style={{ cursor: 'pointer' }}>
                            <td>{aire.nombre}</td>
                            <td>{aire.ubicacion}</td>
                            <td>{formatDate(aire.fecha_instalacion)}</td>
                            {canManage && (
                                <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => onEdit(aire)}
                                        title="Editar Aire"
                                    >
                                        <FiEdit />
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => onDelete(aire.id)}
                                        title="Eliminar Aire"
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

export default AiresTable;
