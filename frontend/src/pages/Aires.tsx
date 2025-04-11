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
  id: number; // El ID lo asigna el backend, pero es útil tenerlo
  nombre: string;
  ubicacion: string;
  fecha_instalacion: string; // Mantener como string YYYY-MM-DD
  tipo?: string; // Ej: 'Split', 'Ventana', 'Central'
  toneladas?: number | null;
  // Evaporadora
  evaporadora_operativa?: boolean;
  evaporadora_marca?: string;
  evaporadora_modelo?: string;
  evaporadora_serial?: string;
  evaporadora_codigo_inventario?: string;
  evaporadora_ubicacion_instalacion?: string;
  // Condensadora
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
    const { name, value, type, checked } = e.target as HTMLInputElement; // Asegurar tipo para acceder a 'checked'

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox'
              ? checked // Para checkboxes, usa el valor 'checked' (boolean)
              : type === 'number'
              ? (value === '' ? null : parseFloat(value)) // Para números
              : value // Para otros tipos (text, date, select, etc.)
    }));
  }, []); // useCallback para estabilidad

  // --- Abrir modal para Agregar ---
  const handleAdd = useCallback(() => {
    setFormData({
      // Campos principales
      nombre: '',
      ubicacion: '',
      fecha_instalacion: formatDate(new Date().toISOString(), true), // Fecha actual
      tipo: '', // O un valor por defecto como 'Split'
      toneladas: null, // O 0 si prefieres

      // Evaporadora
      evaporadora_operativa: true, // Valor por defecto
      evaporadora_marca: '',
      evaporadora_modelo: '',
      evaporadora_serial: '',
      evaporadora_codigo_inventario: '',
      evaporadora_ubicacion_instalacion: '', // Podría ser igual a 'ubicacion' por defecto?

      // Condensadora
      condensadora_operativa: true, // Valor por defecto
      condensadora_marca: '',
      condensadora_modelo: '',
      condensadora_serial: '',
      condensadora_codigo_inventario: '',
      condensadora_ubicacion_instalacion: '',

      // Incluye aquí otros campos si decidiste mantenerlos y quieres darles valor inicial
      // Ejemplo:
      // tipo_refrigerante: 'R-410A',
      // estado: 'Activo',
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
        ...fullDetails, // Propaga todos los detalles del backend
        // Asegúrate que la fecha de instalación esté formateada para el input
        fecha_instalacion: formatDate(fullDetails.fecha_instalacion, true),
        // Asegúrate que 'toneladas' sea null si no viene, o maneja la conversión si es necesario
        toneladas: fullDetails.toneladas ?? null,
         // Asegúrate que los booleanos se manejen correctamente
        evaporadora_operativa: !!fullDetails.evaporadora_operativa,
        condensadora_operativa: !!fullDetails.condensadora_operativa,
        // Las propiedades 'fecha_ultimo_mantenimiento' y 'capacidad_btu' ya no se incluyen aquí
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

    // Validación básica
    if (!formData.nombre || !formData.ubicacion || !formData.fecha_instalacion) {
        setEditError("Nombre, Ubicación y Fecha de Instalación son requeridos.");
        return;
    }
    // Añade validación para 'tipo' si es requerido por el backend
    if (!formData.tipo) {
        setEditError("El campo 'Tipo' es requerido.");
        return;
    }

    // Prepara el payload que coincide con lo esperado por el backend (app.py)
    const payload: Partial<AireAcondicionado> = {
        ...formData,
        // Asegura formato YYYY-MM-DD para la fecha
        fecha_instalacion: formData.fecha_instalacion ? formData.fecha_instalacion.split('T')[0] : '',
        // Asegura que toneladas sea número o null
        toneladas: formData.toneladas ? Number(formData.toneladas) : null,
        // Asegura que los booleanos se envíen correctamente
        evaporadora_operativa: !!formData.evaporadora_operativa,
        condensadora_operativa: !!formData.condensadora_operativa,
        // Las propiedades 'fecha_ultimo_mantenimiento' y 'capacidad_btu' ya no se incluyen aquí
    };

    // Elimina id del payload si estamos en modo 'add'
    if (formMode === 'add') {
        delete payload.id;
    }

    console.log("Enviando payload:", payload); // Línea para depuración

    try {
      let updatedAire: AireAcondicionado | null = null;

      if (formMode === 'add') {
        // Asegúrate que el payload coincide con los campos esperados por POST /api/aires en app.py
        const response = await api.post('/aires', payload);
        // Ajusta según la estructura real de la respuesta del backend
        updatedAire = response.data?.data || response.data;

        if (updatedAire && updatedAire.id) {
             setAiresList(prevList => [...prevList, {
                id: updatedAire!.id,
                nombre: updatedAire!.nombre,
                ubicacion: updatedAire!.ubicacion,
                fecha_instalacion: updatedAire!.fecha_instalacion
             }]);
        } else {
             console.warn("No se recibió el nuevo aire creado desde el backend o faltó el ID. Refrescando lista...");
             fetchAiresList(); // Recargar lista como fallback
        }

      } else if (formMode === 'edit' && formData.id) {
        // Asegúrate que el payload coincide con los campos esperados por PUT /api/aires/{id} en app.py
        const response = await api.put(`/aires/${formData.id}`, payload);
        // Ajusta según la estructura real de la respuesta del backend
        updatedAire = response.data?.data || response.data;

        // Actualiza el item en la lista - usa datos de la respuesta si están disponibles, si no, usa formData
        setAiresList(prevList => prevList.map(aire =>
          aire.id === formData.id
            ? {
                ...aire, // Mantén campos existentes del item de la lista
                nombre: updatedAire?.nombre ?? formData.nombre ?? aire.nombre,
                ubicacion: updatedAire?.ubicacion ?? formData.ubicacion ?? aire.ubicacion,
                fecha_instalacion: updatedAire?.fecha_instalacion ?? formData.fecha_instalacion ?? aire.fecha_instalacion,
                // Actualiza otros campos en la lista si es necesario (ej. tipo)
              }
            : aire
        ));
      }

      setShowEditModal(false); // Cierra el modal si todo fue bien
    } catch (error: any) {
      console.error('Error al guardar:', error);
      // Muestra un error más detallado si viene del backend
      if (error.response) {
          console.error("Error Respuesta Backend:", error.response.data);
          const message = error.response.data?.mensaje || 'Error al guardar el aire acondicionado';
          // Intenta mostrar errores específicos de campos si existen
          const errorDetails = JSON.stringify(error.response.data?.errors || error.response.data);
          setEditError(`${message} (Detalles: ${errorDetails})`);
      } else {
          // Error de red u otro
          setEditError('Error de red o al procesar la solicitud');
      }
      // Mantén el modal abierto en caso de error
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
