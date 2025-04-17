// src/components/OtrosEquipos/OtrosEquiposTable.tsx
import React from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FiEdit, FiTrash2, FiPackage, FiPlus } from 'react-icons/fi'; // Usar FiPackage o similar

// Interfaz para los items de la lista (puede ser más simple que la completa)
interface OtroEquipoListItem {
    id: number;
    nombre: string;
    tipo: string;
    ubicacion?: string | null;
    estado_operativo: boolean;
}

interface OtrosEquiposTableProps {
    equiposList: OtroEquipoListItem[];
    loading: boolean;
    error: string | null;
    canManage: boolean;
    onRowClick: (id: number) => void; // Para ver detalles
    onEdit: (equipo: OtroEquipoListItem) => void;
    onDelete: (id: number) => void;
    onAdd: () => void; // Para el botón en estado vacío
    // No necesitamos formatDate aquí a menos que mostremos fecha_instalacion en la tabla
}

const OtrosEquiposTable: React.FC<OtrosEquiposTableProps> = ({
    equiposList,
    loading,
    error,
    canManage,
    onRowClick,
    onEdit,
    onDelete,
    onAdd,
}) => {

    if (loading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando equipos...</p>
            </div>
        );
    }

    // El error general se muestra en el componente padre
    if (error && equiposList.length === 0) {
         // Muestra error solo si no hay datos y hay error
         return <Alert variant="danger">Error al cargar los equipos: {error}</Alert>;
    }


    if (equiposList.length === 0) {
        return (
            <div className="text-center p-5">
                <FiPackage size={50} className="text-muted mb-3" />
                <h4>No hay equipos registrados</h4>
                {canManage && (
                    <Button variant="primary" className="mt-3" onClick={onAdd}>
                        <FiPlus className="me-2" /> Agregar primer equipo
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
                        <th>Tipo</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        {canManage && <th className="text-end">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {equiposList.map(equipo => (
                        <tr key={equipo.id} onClick={() => onRowClick(equipo.id)} style={{ cursor: 'pointer' }}>
                            <td>{equipo.nombre}</td>
                            <td>{equipo.tipo}</td>
                            <td>{equipo.ubicacion || '-'}</td>
                            <td>
                                <span className={`badge bg-${equipo.estado_operativo ? 'success' : 'danger'}`}>
                                    {equipo.estado_operativo ? 'Operativo' : 'Inoperativo'}
                                </span>
                            </td>
                            {canManage && (
                                <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => onEdit(equipo)}
                                        title="Editar Equipo"
                                    >
                                        <FiEdit />
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => onDelete(equipo.id)}
                                        title="Eliminar Equipo"
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

export default OtrosEquiposTable;
