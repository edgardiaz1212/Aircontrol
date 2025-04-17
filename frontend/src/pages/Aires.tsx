// src/pages/Aires.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

import AiresTable from '../components/Aires/AiresTable';
import AiresAddEditModal from '../components/Aires/AiresAddEditModal';
import AiresViewModal from '../components/Aires/AiresViewModal';

// --- Interfaces ---
interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
  fecha_instalacion: string; // El backend devuelve formato GMT, formatDate lo maneja
  tipo?: string;
  toneladas?: number | null;
  evaporadora_operativa?: boolean;
  evaporadora_marca?: string;
  evaporadora_modelo?: string;
  evaporadora_serial?: string;
  evaporadora_codigo_inventario?: string;
  evaporadora_ubicacion_instalacion?: string;
  condensadora_operativa?: boolean;
  condensadora_marca?: string;
  condensadora_modelo?: string;
  condensadora_serial?: string;
  condensadora_codigo_inventario?: string;
  condensadora_ubicacion_instalacion?: string;
}

interface AireAcondicionadoListItem {
    id: number;
    nombre: string;
    ubicacion: string;
    fecha_instalacion: string; // El backend devuelve formato GMT, formatDate lo maneja
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
      // new Date() puede parsear el formato "Mon, 15 May 2023 00:00:00 GMT"
      let date = new Date(dateString);
      if (isNaN(date.getTime())) {
          // Fallback si el formato GMT falla por alguna razón
          // Intentar parsear como YYYY-MM-DD si no tiene GMT
          if (!dateString.includes('GMT')) {
              const dateWithTime = new Date(dateString + 'T00:00:00'); // Asumir inicio del día local
               if (!isNaN(dateWithTime.getTime())) {
                   date = dateWithTime;
               } else {
                   console.warn("Fecha inválida recibida (fallback también falló):", dateString);
                   return forInput ? '' : 'Fecha inválida';
               }
          } else {
              console.warn("Fecha inválida recibida (formato GMT?):", dateString);
              return forInput ? '' : 'Fecha inválida';
          }
      }

      if (forInput) {
        // Usar UTC para obtener los componentes y evitar desplazamientos de zona horaria
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        // Para mostrar, usar el formato local es generalmente aceptable
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return forInput ? '' : 'Error fecha';
    }
  }, []);


  // --- Cargar lista de aires acondicionados (Refactorizado con useCallback y AbortController) ---
  const fetchAiresList = useCallback(async (signal?: AbortSignal) => {
    // No establecer loading/error aquí, se hace en el caller (useEffect)
    try {
      const config = signal ? { signal } : {};
      const response = await api.get<AireAcondicionadoListItem[]>('/aires', config);

      // Verificar si fue abortada *después* de la respuesta pero *antes* de actualizar estado
      if (signal?.aborted) {
        console.log('fetchAiresList: Petición abortada antes de setear estado.');
        return; // No actualizar estado
      }

      // Verificar directamente si response.data es un array
      if (Array.isArray(response.data)) {
        setAiresList(response.data);
        setError(null); // Limpiar error en éxito
      } else {
        console.error("fetchAiresList: Unexpected response format for /aires (expected array):", response.data);
        setAiresList([]);
        // Solo establecer error si no fue abortada
        if (!signal?.aborted) {
            setError("Formato de respuesta inesperado del servidor al listar aires.");
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('fetchAiresList: Petición abortada (catch).');
        // No establecer error si fue abortada
      } else {
        console.error('fetchAiresList: Error al cargar lista de aires:', error);
        // Solo establecer error si no fue abortada
        if (!signal?.aborted) {
            setError(error.response?.data?.mensaje || error.message || 'Error al cargar los aires acondicionados');
            setAiresList([]);
        }
      }
    } finally {
      // Quitar el loading solo si la petición no fue abortada
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []); // Array de dependencias vacío, api es estable

  // useEffect para llamar a fetchAiresList en el montaje y manejar limpieza
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); // Establecer loading al inicio del efecto
    fetchAiresList(controller.signal); // Llamar con la señal

    // Función de limpieza que aborta la petición
    return () => {
      console.log("Limpiando efecto de Aires.tsx, abortando fetch...");
      controller.abort();
    };
  }, [fetchAiresList]); // Depender de la función estable fetchAiresList

  // --- Handlers ---

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prevData => ({
      ...prevData,
      [name]: isCheckbox
              ? checked
              : type === 'number'
              ? (value === '' ? null : parseFloat(value)) // Manejar campo vacío para número
              : value
    }));
  }, []);

  const handleAdd = useCallback(() => {
    setFormData({
      nombre: '',
      ubicacion: '',
      fecha_instalacion: formatDate(new Date().toISOString(), true),
      tipo: '',
      toneladas: null,
      evaporadora_operativa: true,
      evaporadora_marca: '',
      evaporadora_modelo: '',
      evaporadora_serial: '',
      evaporadora_codigo_inventario: '',
      evaporadora_ubicacion_instalacion: '',
      condensadora_operativa: true,
      condensadora_marca: '',
      condensadora_modelo: '',
      condensadora_serial: '',
      condensadora_codigo_inventario: '',
      condensadora_ubicacion_instalacion: '',
    });
    setModalTitle('Agregar Aire Acondicionado');
    setFormMode('add');
    setEditError(null);
    setShowEditModal(true);
    setShowViewModal(false);
  }, [formatDate]);

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
        tipo: undefined,
        toneladas: null,
    });
    setLoadingEditDetails(true);
    setShowEditModal(true);

    try {
      // No necesitamos AbortController aquí, es una acción directa del usuario
      const response = await api.get<AireAcondicionado>(`/aires/${aireListItem.id}`);
      const fullDetails = response.data;
      if (fullDetails && typeof fullDetails === 'object' && fullDetails.id) {
          setFormData({
            ...fullDetails,
            fecha_instalacion: formatDate(fullDetails.fecha_instalacion, true),
            toneladas: (typeof fullDetails.toneladas === 'number' && !isNaN(fullDetails.toneladas)) ? fullDetails.toneladas : null,
            evaporadora_operativa: !!fullDetails.evaporadora_operativa,
            condensadora_operativa: !!fullDetails.condensadora_operativa,
          });
      } else {
          throw new Error("Formato de respuesta inválido al cargar detalles.");
      }
    } catch (error: any) {
      console.error(`Error al cargar detalles para editar aire ${aireListItem.id}:`, error);
      setEditError(error.response?.data?.mensaje || error.message || `Error al cargar detalles para editar.`);
    } finally {
      setLoadingEditDetails(false);
    }
  }, [formatDate]);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este aire acondicionado? Esta acción no se puede deshacer.')) {
      const originalList = [...airesList];
      setAiresList(prevList => prevList.filter(aire => aire.id !== id));
      setError(null);
      try {
        // No necesitamos AbortController aquí
        await api.delete(`/aires/${id}`);
        // Éxito, la UI ya está actualizada (optimista)
      } catch (error: any) {
        console.error('Error al eliminar aire:', error);
        setError(error.response?.data?.mensaje || 'Error al eliminar el aire acondicionado');
        setAiresList(originalList); // Revertir en caso de error
      }
    }
  }, [airesList]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null); // Limpiar error del modal
    // No limpiar error general aquí, podría haber uno de carga
     setError(null);

   // --- VALIDACIÓN ---
   const requiredFields: (keyof AireAcondicionado)[] = [
    'nombre',
    'ubicacion',
    'fecha_instalacion',
    // Añadir los campos únicos
    'evaporadora_serial',
    'evaporadora_codigo_inventario',
    'condensadora_serial',
    'condensadora_codigo_inventario'
];

const missingFields = requiredFields.filter(field => !formData[field]);

if (missingFields.length > 0) {
    // Crear un mensaje de error más específico
    const fieldNames = missingFields.map(field => {
        // Mapear nombres técnicos a nombres legibles
        switch(field) {
            case 'nombre': return 'Nombre';
            case 'ubicacion': return 'Ubicación';
            case 'fecha_instalacion': return 'Fecha de Instalación';
            case 'evaporadora_serial': return 'Serial Evaporadora';
            case 'evaporadora_codigo_inventario': return 'Inventario Evaporadora';
            case 'condensadora_serial': return 'Serial Condensadora';
            case 'condensadora_codigo_inventario': return 'Inventario Condensadora';
            default: return field;
        }
    }).join(', ');
    setEditError(`Los siguientes campos son requeridos: ${fieldNames}.`);
    return; // Detener el envío
}

    const payload: Partial<AireAcondicionado> = {
        ...formData,
        fecha_instalacion: formData.fecha_instalacion ? formData.fecha_instalacion.split('T')[0] : '',
        toneladas: (formData.toneladas !== null && formData.toneladas !== undefined && !isNaN(Number(formData.toneladas))) ? Number(formData.toneladas) : null,
        evaporadora_operativa: !!formData.evaporadora_operativa,
        condensadora_operativa: !!formData.condensadora_operativa,
    };
    if (formMode === 'add') { delete payload.id; }

    console.log("Enviando payload:", payload);
    // setLoadingSubmit(true); // Añadir si se quiere feedback de carga en el botón

    try {
      let response;
      if (formMode === 'add') {
        response = await api.post<{ success: boolean; mensaje: string; data: AireAcondicionado }>('/aires', payload);
        if (!response.data?.success) {
            // --- MEJORA: Capturar error de duplicado del backend ---
            if (response.data?.mensaje?.toLowerCase().includes('duplicate') || response.data?.mensaje?.toLowerCase().includes('único')) {
                 throw new Error(`Error: Ya existe un registro con ese Serial o Código de Inventario.`);
            }
            throw new Error(response.data?.mensaje || "Error al agregar aire.");
        }
      } else if (formMode === 'edit' && formData.id) {
        response = await api.put<{ success: boolean; mensaje: string; data?: AireAcondicionado }>(`/aires/${formData.id}`, payload);
         if (!response.data?.success) {
             // --- MEJORA: Capturar error de duplicado del backend ---
             if (response.data?.mensaje?.toLowerCase().includes('duplicate') || response.data?.mensaje?.toLowerCase().includes('único')) {
                 throw new Error(`Error: Ya existe otro registro con ese Serial o Código de Inventario.`);
            }
            throw new Error(response.data?.mensaje || "Error al actualizar aire.");
        }
      }

      setShowEditModal(false);
      setLoading(true);
      await fetchAiresList();

    } catch (error: any) {
      console.error('Error al guardar:', error);
      // Mostrar el mensaje de error específico (incluyendo el de duplicado)
      setEditError(error.message || 'Error de red o al procesar la solicitud');
      // No cerrar el modal en caso de error para que el usuario corrija
    } finally {
        // setLoadingSubmit(false);
    }
  }, [formData, formMode, fetchAiresList]);

  const handleRowClick = useCallback(async (id: number) => {
    setShowViewModal(true);
    setLoadingDetails(true);
    setViewError(null);
    setSelectedAireDetails(null);
    try {
      // No necesitamos AbortController aquí
      const response = await api.get<AireAcondicionado>(`/aires/${id}`);
      if (response.data && typeof response.data === 'object' && response.data.id) {
          setSelectedAireDetails(response.data);
      } else {
          throw new Error("Formato de respuesta inválido al cargar detalles.");
      }
    } catch (error: any) {
      console.error(`Error al cargar detalles del aire ${id}:`, error);
      setViewError(error.response?.data?.mensaje || error.message || `Error al cargar detalles.`);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // --- Renderizado ---
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
          <AiresTable
            airesList={airesList}
            loading={loading}
            error={error} // Pasar error para manejo interno si es necesario
            canManage={canManage}
            onRowClick={handleRowClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            formatDate={formatDate}
          />
        </Card.Body>
      </Card>

      {/* Modales */}
      <AiresAddEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        modalTitle={modalTitle}
        formData={formData}
        formMode={formMode}
        loadingEditDetails={loadingEditDetails}
        editError={editError} // Pasar error para mostrar en modal
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
