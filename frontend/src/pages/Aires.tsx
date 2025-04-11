import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from 'react-bootstrap'; // Simplified imports
import { FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

// Importar los nuevos componentes
import AiresTable from '../components/Aires/AiresTable';
import AiresAddEditModal from '../components/Aires/AiresAddEditModal';
import AiresViewModal from '../components/Aires/AiresViewModal';

// --- Interfaces (pueden moverse a un archivo types.ts) ---
interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
  fecha_instalacion: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  capacidad_btu?: number | null;
  tipo_refrigerante?: string;
  eficiencia_energetica?: string;
  fecha_ultimo_mantenimiento?: string | null;
  estado?: string;
}

interface AireAcondicionadoListItem {
    id: number;
    nombre: string;
    ubicacion: string;
    fecha_instalacion: string;
}

// --- Componente Contenedor Principal ---
const Aires: React.FC = () => {
  const { user } = useAppContext();
  const [airesList, setAiresList] = useState<AireAcondicionadoListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for the Edit/Add Modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [formData, setFormData] = useState<Partial<AireAcondicionado>>({});
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [loadingEditDetails, setLoadingEditDetails] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // State for the View Details Modal
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedAireDetails, setSelectedAireDetails] = useState<AireAcondicionado | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [viewError, setViewError] = useState<string | null>(null);

  const canManage = user?.rol === 'admin' || user?.rol === 'supervisor';

  // --- Helper para formatear fechas ---
  const formatDate = useCallback((dateString: string | null | undefined, forInput: boolean = false): string => {
    if (!dateString) return '';
    try {
      let date = new Date(dateString);
      if (isNaN(date.getTime())) {
          const dateWithTime = new Date(dateString + 'T00:00:00');
          if (isNaN(dateWithTime.getTime())) {
              return forInput ? '' : 'Fecha inválida';
          }
          date = dateWithTime;
      }
      if (forInput) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return forInput ? '' : 'Error fecha';
    }
  }, []);

  // --- Cargar lista de aires acondicionados ---
  const fetchAiresList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/aires');
      const data = response.data?.data || response.data || [];
      if (Array.isArray(data)) {
          setAiresList(data as AireAcondicionadoListItem[]);
      } else {
          console.error("Unexpected response format for /aires:", response.data);
          setAiresList([]);
          setError("Formato de respuesta inesperado del servidor al listar aires.");
      }
    } catch (error: any) {
      console.error('Error al cargar lista de aires:', error);
      setError(error.response?.data?.mensaje || 'Error al cargar los aires acondicionados');
      setAiresList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAiresList();
  }, [fetchAiresList]);

  // --- Manejar cambios en el formulario de Edición/Creación ---
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
    }));
  }, []); // useCallback para estabilidad

  // --- Abrir modal para Agregar ---
  const handleAdd = useCallback(() => {
    setFormData({
      nombre: '',
      ubicacion: '',
      fecha_instalacion: formatDate(new Date().toISOString(), true),
      marca: '',
      modelo: '',
      numero_serie: '',
      capacidad_btu: null,
      tipo_refrigerante: '',
      eficiencia_energetica: '',
      estado: 'Activo',
      fecha_ultimo_mantenimiento: null
    });
    setModalTitle('Agregar Aire Acondicionado');
    setFormMode('add');
    setEditError(null);
    setShowEditModal(true);
    setShowViewModal(false);
  }, [formatDate]); // Dependencia de formatDate

  // --- Abrir modal para Editar (y cargar detalles) ---
  const handleEdit = useCallback(async (aireListItem: AireAcondicionadoListItem) => {
    setFormMode('edit');
    setModalTitle('Editar Aire Acondicionado');
    setEditError(null);
    setShowViewModal(false);

    setFormData({
        id: aireListItem.id,
        nombre: aireListItem.nombre,
        ubicacion: aireListItem.ubicacion,
        fecha_instalacion: formatDate(aireListItem.fecha_instalacion, true),
    });
    setLoadingEditDetails(true);
    setShowEditModal(true);

    try {
      const response = await api.get<AireAcondicionado>(`/aires/${aireListItem.id}`);
      const fullDetails = response.data;
      setFormData({
        ...fullDetails,
        fecha_instalacion: formatDate(fullDetails.fecha_instalacion, true),
        fecha_ultimo_mantenimiento: formatDate(fullDetails.fecha_ultimo_mantenimiento, true),
        capacidad_btu: fullDetails.capacidad_btu ?? null,
      });
    } catch (error: any) {
      console.error(`Error al cargar detalles completos para editar aire ${aireListItem.id}:`, error);
      setEditError(error.response?.data?.mensaje || `Error al cargar detalles para editar.`);
    } finally {
      setLoadingEditDetails(false);
    }
  }, [formatDate]); // Dependencia de formatDate

  // --- Eliminar aire ---
  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este aire acondicionado? Esta acción no se puede deshacer.')) {
      const originalList = [...airesList];
      setAiresList(prevList => prevList.filter(aire => aire.id !== id));
      setError(null);

      try {
        await api.delete(`/aires/${id}`);
      } catch (error: any) {
        console.error('Error al eliminar aire:', error);
        setError(error.response?.data?.mensaje || 'Error al eliminar el aire acondicionado');
        setAiresList(originalList);
      }
    }
  }, [airesList]); // Dependencia de airesList

  // --- Enviar formulario de Edición/Creación ---
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setError(null);

    if (!formData.nombre || !formData.ubicacion || !formData.fecha_instalacion) {
        setEditError("Nombre, Ubicación y Fecha de Instalación son requeridos.");
        return;
    }

    const payload: Partial<AireAcondicionado> = {
        ...formData,
        fecha_instalacion: formData.fecha_instalacion ? formData.fecha_instalacion.split('T')[0] : '',
        fecha_ultimo_mantenimiento: formData.fecha_ultimo_mantenimiento ? formData.fecha_ultimo_mantenimiento.split('T')[0] : null,
        capacidad_btu: formData.capacidad_btu ? Number(formData.capacidad_btu) : null,
    };
    if (formMode === 'add') {
        delete payload.id;
    }

    try {
      let updatedAire: AireAcondicionado | null = null;

      if (formMode === 'add') {
        const response = await api.post('/aires', payload);
        updatedAire = response.data?.data || response.data;
        if (updatedAire && updatedAire.id) {
             setAiresList(prevList => [...prevList, {
                id: updatedAire!.id,
                nombre: updatedAire!.nombre,
                ubicacion: updatedAire!.ubicacion,
                fecha_instalacion: updatedAire!.fecha_instalacion
             }]);
        } else {
             console.warn("No se recibió el nuevo aire creado desde el backend. Refrescando lista...");
             fetchAiresList();
        }

      } else if (formMode === 'edit' && formData.id) {
        const response = await api.put(`/aires/${formData.id}`, payload);
        updatedAire = response.data?.data || response.data;
        setAiresList(prevList => prevList.map(aire =>
          aire.id === formData.id
            ? {
                ...aire,
                nombre: updatedAire?.nombre ?? formData.nombre ?? aire.nombre,
                ubicacion: updatedAire?.ubicacion ?? formData.ubicacion ?? aire.ubicacion,
                fecha_instalacion: updatedAire?.fecha_instalacion ?? formData.fecha_instalacion ?? aire.fecha_instalacion,
              }
            : aire
        ));
      }

      setShowEditModal(false);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      const message = error.response?.data?.mensaje || 'Error al guardar el aire acondicionado';
      setEditError(message);
    }
  }, [formData, formMode, fetchAiresList]); // Dependencias

  // --- Abrir modal de Detalles (al hacer clic en la fila) ---
  const handleRowClick = useCallback(async (id: number) => {
    setShowViewModal(true);
    setLoadingDetails(true);
    setViewError(null);
    setSelectedAireDetails(null);

    try {
      const response = await api.get<AireAcondicionado>(`/aires/${id}`);
      setSelectedAireDetails(response.data);
    } catch (error: any) {
      console.error(`Error al cargar detalles del aire ${id}:`, error);
      setViewError(error.response?.data?.mensaje || `Error al cargar detalles del aire acondicionado ${id}`);
    } finally {
      setLoadingDetails(false);
    }
  }, []); // Sin dependencias

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1>Aires Acondicionados</h1>
        {canManage && (
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Agregar Aire
          </Button>
        )}
      </div>

      {/* General Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Card */}
      <Card className="dashboard-card">
        <Card.Body>
          {/* Usar el componente de tabla */}
          <AiresTable
            airesList={airesList}
            loading={loading}
            error={error} // Pasar el error general
            canManage={canManage}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd} // Pasar handleAdd para el botón de estado vacío
            formatDate={formatDate}
          />
        </Card.Body>
      </Card>

      {/* --- Modales (usando los componentes) --- */}
      <AiresAddEditModal
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

      <AiresViewModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        selectedAireDetails={selectedAireDetails}
        loadingDetails={loadingDetails}
        viewError={viewError}
        formatDate={formatDate}
      />
    </div>
  );
};

export default Aires;
