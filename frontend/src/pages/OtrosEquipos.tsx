// src/pages/OtrosEquipos.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from 'react-bootstrap'; // Usar react-bootstrap
import { FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext'; // Asumiendo que tienes AppContext

// Importar los nuevos componentes específicos
import OtrosEquiposTable from '../components/OtrosEquipos/OtrosEquiposTable';
import OtrosEquiposAddEditModal from '../components/OtrosEquipos/OtrosEquiposAddEditModal';
import OtrosEquiposViewModal from '../components/OtrosEquipos/OtrosEquiposViewModal';

// --- Interfaces ---
// Interfaz completa del equipo
interface OtroEquipo {
    id: number;
    nombre: string;
    tipo: 'Motogenerador' | 'UPS' | 'PDU' | 'Otro';
    ubicacion?: string | null;
    marca?: string | null;
    modelo?: string | null;
    serial?: string | null;
    codigo_inventario?: string | null;
    fecha_instalacion?: string | null; // Formato YYYY-MM-DD
    estado_operativo: boolean;
    notas?: string | null;
    fecha_creacion?: string;
    ultima_modificacion?: string;
}

// Interfaz para los items de la lista (puede ser más simple)
interface OtroEquipoListItem {
    id: number;
    nombre: string;
    tipo: string;
    ubicacion?: string | null;
    estado_operativo: boolean;
}

// --- Componente Contenedor Principal ---
const OtrosEquipos: React.FC = () => {
    const { user } = useAppContext(); // Obtener usuario del contexto
    const [equiposList, setEquiposList] = useState<OtroEquipoListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for the Edit/Add Modal
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [modalTitle, setModalTitle] = useState<string>('');
    const [formData, setFormData] = useState<Partial<OtroEquipo>>({});
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [loadingEditDetails, setLoadingEditDetails] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);

    // State for the View Details Modal
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [selectedEquipoDetails, setSelectedEquipoDetails] = useState<OtroEquipo | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [viewError, setViewError] = useState<string | null>(null);

    const canManage = user?.rol === 'admin' || user?.rol === 'supervisor';

    // --- Helper para formatear fechas (igual que en Aires.tsx) ---
    const formatDate = useCallback((dateString: string | null | undefined, forInput: boolean = false): string => {
        if (!dateString) return '';
        try {
            // Intenta manejar ambos formatos: YYYY-MM-DD y YYYY-MM-DD HH:MM:SS
            let date;
            if (dateString.includes(' ')) { // Asume formato con hora
                date = new Date(dateString.replace(' ', 'T') + 'Z'); // Añade T y Z para UTC si es necesario
            } else { // Asume solo fecha
                 // Corrección: Añadir hora para evitar problemas de zona horaria en algunos navegadores
                date = new Date(dateString + 'T00:00:00');
            }

            if (isNaN(date.getTime())) {
                console.warn("Fecha inválida recibida:", dateString);
                return forInput ? '' : 'Fecha inválida';
            }

            if (forInput) {
                // Siempre devuelve YYYY-MM-DD para input type="date"
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                return `${year}-${month}-${day}`;
            } else {
                // Formato legible para mostrar
                return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            }
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return forInput ? '' : 'Error fecha';
        }
    }, []);

    // --- Cargar lista de equipos ---
    const fetchEquiposList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // La API /api/otros-equipos ya devuelve la lista directamente
            const response = await api.get<OtroEquipoListItem[]>('/otros-equipos');
            setEquiposList(response.data || []);
        } catch (error: any) {
            console.error('Error al cargar lista de equipos:', error);
            setError(error.response?.data?.mensaje || 'Error al cargar los equipos');
            setEquiposList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEquiposList();
    }, [fetchEquiposList]);

    // --- Manejar cambios en el formulario de Edición/Creación ---
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked; // Solo relevante para checkbox

        setFormData(prevData => ({
            ...prevData,
            [name]: isCheckbox ? checked : value
        }));
    }, []);

    // --- Abrir modal para Agregar ---
    const handleAdd = useCallback(() => {
        setFormData({
            nombre: '',
            tipo: 'Otro', // Valor por defecto
            ubicacion: '',
            marca: '',
            modelo: '',
            serial: '',
            codigo_inventario: '',
            fecha_instalacion: formatDate(new Date().toISOString(), true), // Fecha actual
            estado_operativo: true,
            notas: '',
        });
        setModalTitle('Agregar Equipo');
        setFormMode('add');
        setEditError(null);
        setShowEditModal(true);
        setShowViewModal(false); // Asegura que el otro modal esté cerrado
    }, [formatDate]);

    // --- Abrir modal para Editar (y cargar detalles) ---
    const handleEdit = useCallback(async (equipoListItem: OtroEquipoListItem) => {
        setFormMode('edit');
        setModalTitle('Editar Equipo');
        setEditError(null);
        setShowViewModal(false); // Asegura que el otro modal esté cerrado

        // Establece datos iniciales básicos de la lista
        setFormData({
            id: equipoListItem.id,
            nombre: equipoListItem.nombre,
            tipo: equipoListItem.tipo as OtroEquipo['tipo'], // Asumir que el tipo de la lista es válido
            ubicacion: equipoListItem.ubicacion,
            estado_operativo: equipoListItem.estado_operativo,
            // Otros campos se cargarán a continuación
        });
        setLoadingEditDetails(true);
        setShowEditModal(true); // Mostrar modal mientras carga

        try {
            // Carga los detalles completos del equipo
            const response = await api.get<OtroEquipo>(`/otros-equipos/${equipoListItem.id}`);
            const fullDetails = response.data;
            setFormData({
                ...fullDetails,
                // Formatear fecha para el input
                fecha_instalacion: formatDate(fullDetails.fecha_instalacion, true),
                // Asegurar que el booleano se maneje correctamente
                estado_operativo: !!fullDetails.estado_operativo,
            });
        } catch (error: any) {
            console.error(`Error al cargar detalles completos para editar equipo ${equipoListItem.id}:`, error);
            setEditError(error.response?.data?.mensaje || `Error al cargar detalles para editar.`);
            // Considera cerrar el modal o mostrar el error persistentemente
            // setShowEditModal(false);
        } finally {
            setLoadingEditDetails(false);
        }
    }, [formatDate]);

    // --- Eliminar equipo ---
    const handleDelete = useCallback(async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este equipo? Esta acción no se puede deshacer.')) {
            const originalList = [...equiposList];
            // Optimistic UI update
            setEquiposList(prevList => prevList.filter(equipo => equipo.id !== id));
            setError(null); // Clear previous general errors

            try {
                await api.delete(`/otros-equipos/${id}`);
                // No es necesario refetch si la eliminación fue exitosa
            } catch (error: any) {
                console.error('Error al eliminar equipo:', error);
                setError(error.response?.data?.mensaje || 'Error al eliminar el equipo');
                // Revertir si hubo error
                setEquiposList(originalList);
            }
        }
    }, [equiposList]);

    // --- Enviar formulario de Edición/Creación ---
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError(null); // Limpiar errores específicos del modal
        setError(null);    // Limpiar errores generales

        // Validación básica (igual que en el modal)
        if (!formData.nombre || !formData.tipo) {
            setEditError("Nombre y Tipo son requeridos.");
            return;
        }

        // Prepara el payload
        const payload: Partial<OtroEquipo> = {
            ...formData,
            fecha_instalacion: formData.fecha_instalacion || null, // Enviar null si está vacío
            // Asegurar que el booleano se envíe correctamente
            estado_operativo: !!formData.estado_operativo,
        };

        // Elimina id del payload si estamos en modo 'add'
        if (formMode === 'add') {
            delete payload.id;
        }

        // Indicar carga (podría ser un estado específico para el submit)
        // setLoadingSubmit(true);

        try {
            let response;
            let updatedEquipo: OtroEquipo | null = null;

            if (formMode === 'add') {
                response = await api.post<{ success: boolean; mensaje: string; data: OtroEquipo }>('/otros-equipos', payload);
                updatedEquipo = response.data?.data; // Backend devuelve el objeto completo en 'data'

                if (updatedEquipo?.id) {
                    // Añadir a la lista localmente
                    setEquiposList(prevList => [...prevList, {
                        id: updatedEquipo!.id,
                        nombre: updatedEquipo!.nombre,
                        tipo: updatedEquipo!.tipo,
                        ubicacion: updatedEquipo!.ubicacion,
                        estado_operativo: updatedEquipo!.estado_operativo,
                    }]);
                } else {
                    console.warn("No se recibió el nuevo equipo creado desde el backend o faltó el ID. Refrescando lista...");
                    fetchEquiposList(); // Recargar como fallback
                }

            } else if (formMode === 'edit' && formData.id) {
                response = await api.put<{ success: boolean; mensaje: string; data: OtroEquipo }>(`/otros-equipos/${formData.id}`, payload);
                updatedEquipo = response.data?.data; // Backend devuelve el objeto actualizado en 'data'

                if (updatedEquipo?.id) {
                    // Actualizar item en la lista localmente
                    setEquiposList(prevList => prevList.map(eq =>
                        eq.id === formData.id
                            ? { // Crear el objeto ListItem a partir de la respuesta completa
                                id: updatedEquipo!.id,
                                nombre: updatedEquipo!.nombre,
                                tipo: updatedEquipo!.tipo,
                                ubicacion: updatedEquipo!.ubicacion,
                                estado_operativo: updatedEquipo!.estado_operativo,
                              }
                            : eq
                    ));
                } else {
                     console.warn("No se recibió el equipo actualizado desde el backend o faltó el ID. Refrescando lista...");
                     fetchEquiposList(); // Recargar como fallback
                }
            }

            setShowEditModal(false); // Cierra el modal si todo fue bien

        } catch (error: any) {
            console.error('Error al guardar equipo:', error);
            const message = error.response?.data?.mensaje || 'Error al guardar el equipo';
            const errorDetails = JSON.stringify(error.response?.data?.errors || error.response?.data);
            setEditError(`${message} ${error.response?.data?.errors ? '' : `(Detalles: ${errorDetails})`}`);
            // Mantener el modal abierto en caso de error
        } finally {
            // setLoadingSubmit(false);
        }
    }, [formData, formMode, fetchEquiposList]);

    // --- Abrir modal de Detalles (al hacer clic en la fila) ---
    const handleRowClick = useCallback(async (id: number) => {
        setShowViewModal(true);
        setLoadingDetails(true);
        setViewError(null);
        setSelectedEquipoDetails(null); // Limpiar detalles previos

        try {
            const response = await api.get<OtroEquipo>(`/otros-equipos/${id}`);
            setSelectedEquipoDetails(response.data);
        } catch (error: any) {
            console.error(`Error al cargar detalles del equipo ${id}:`, error);
            setViewError(error.response?.data?.mensaje || `Error al cargar detalles del equipo ${id}`);
        } finally {
            setLoadingDetails(false);
        }
    }, []);

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h1>Otros Equipos</h1>
                {canManage && (
                    <Button variant="primary" onClick={handleAdd}>
                        <FiPlus className="me-2" /> Agregar Equipo
                    </Button>
                )}
            </div>

            {/* General Error Alert */}
            {error && !loading && ( // Mostrar error general solo si no está cargando
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Main Card */}
            <Card className="dashboard-card">
                <Card.Body>
                    {/* Usar el componente de tabla específico */}
                    <OtrosEquiposTable
                        equiposList={equiposList}
                        loading={loading}
                        error={error} // Pasar error para manejo interno si es necesario
                        canManage={canManage}
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAdd={handleAdd} // Pasar handleAdd para el botón de estado vacío
                    />
                </Card.Body>
            </Card>

            {/* --- Modales (usando los componentes específicos) --- */}
            <OtrosEquiposAddEditModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                modalTitle={modalTitle}
                formData={formData}
                formMode={formMode}
                loadingEditDetails={loadingEditDetails}
                editError={editError}
                onSubmit={handleSubmit}
                onChange={handleChange}
            />

            <OtrosEquiposViewModal
                show={showViewModal}
                onHide={() => setShowViewModal(false)}
                selectedEquipoDetails={selectedEquipoDetails}
                loadingDetails={loadingDetails}
                viewError={viewError}
                formatDate={formatDate} // Pasar la función de formateo
            />
        </div>
    );
};

export default OtrosEquipos;
