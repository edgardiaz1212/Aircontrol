// src/pages/Aires.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { FiPlus } from 'react-icons/fi';
import api from '../services/api'; // Tu instancia de Axios
import { useAppContext } from '../context/AppContext'; // Contexto de la aplicación

// Importar componentes específicos para Aires
import AiresTable from '../components/Aires/AiresTable';
import AiresAddEditModal from '../components/Aires/AiresAddEditModal';
import AiresViewModal from '../components/Aires/AiresViewModal';

// --- Interfaces (EXPORTADAS desde este archivo) ---
// Interfaz completa para detalles y formulario
export interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
  fecha_instalacion: string; // Formato YYYY-MM-DD o GMT string
  tipo?: string | null; // Permitir null
  toneladas?: number | null;
  evaporadora_operativa?: boolean;
  evaporadora_marca?: string | null;
  evaporadora_modelo?: string | null;
  evaporadora_serial?: string | null; // unique en DB, nullable=true
  evaporadora_codigo_inventario?: string | null; // unique en DB, nullable=true
  evaporadora_ubicacion_instalacion?: string | null;
  condensadora_operativa?: boolean;
  condensadora_marca?: string | null;
  condensadora_modelo?: string | null;
  condensadora_serial?: string | null; // unique en DB, nullable=true
  condensadora_codigo_inventario?: string | null; // unique en DB, nullable=true
  condensadora_ubicacion_instalacion?: string | null;
}

// Interfaz simplificada para la lista mostrada en la tabla
export interface AireAcondicionadoListItem {
    id: number;
    nombre: string;
    ubicacion: string;
    fecha_instalacion: string; // Formato YYYY-MM-DD o GMT string
}

// --- Componente Contenedor Principal ---
const Aires: React.FC = () => {
  const { user } = useAppContext(); // Obtener información del usuario actual
  const [airesList, setAiresList] = useState<AireAcondicionadoListItem[]>([]); // Estado para la lista de aires
  const [loading, setLoading] = useState<boolean>(true); // Estado de carga general
  const [error, setError] = useState<string | null>(null); // Estado para errores generales

  // Estados para el Modal de Agregar/Editar
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [formData, setFormData] = useState<Partial<AireAcondicionado>>({}); // Datos del formulario
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add'); // Modo del formulario
  const [loadingEditDetails, setLoadingEditDetails] = useState<boolean>(false); // Carga de detalles para editar
  const [editError, setEditError] = useState<string | null>(null); // Error específico del modal de edición

  // Estados para el Modal de Ver Detalles
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedAireDetails, setSelectedAireDetails] = useState<AireAcondicionado | null>(null); // Detalles del aire seleccionado
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false); // Carga de detalles para ver
  const [viewError, setViewError] = useState<string | null>(null); // Error específico del modal de vista

  // Determinar permisos basados en el rol del usuario
  const canManage = user?.rol === 'admin' || user?.rol === 'supervisor';

  // --- Helper para formatear fechas ---
  const formatDate = useCallback((dateString: string | null | undefined, forInput: boolean = false): string => {
    if (!dateString) return ''; // Devolver vacío si no hay fecha
    try {
      // Intentar parsear la fecha (maneja GMT y YYYY-MM-DD)
      let date = new Date(dateString);

      // Verificar si el parseo fue exitoso
      if (isNaN(date.getTime())) {
          // Fallback si el formato GMT o YYYY-MM-DD falla
          if (!dateString.includes('GMT') && dateString.includes('-')) {
              // Intentar añadir T00:00:00 si parece YYYY-MM-DD
              const dateWithTime = new Date(dateString + 'T00:00:00');
              if (!isNaN(dateWithTime.getTime())) {
                  date = dateWithTime;
              } else {
                  console.warn("Fecha inválida recibida (fallback también falló):", dateString);
                  return forInput ? '' : 'Fecha inválida';
              }
          } else {
              console.warn("Fecha inválida recibida (formato desconocido?):", dateString);
              return forInput ? '' : 'Fecha inválida';
          }
      }

      if (forInput) {
        // Formato YYYY-MM-DD para input type="date" (usando UTC para evitar problemas de zona horaria)
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else {
        // Formato DD/MM/YYYY para mostrar
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return forInput ? '' : 'Error fecha';
    }
  }, []);


  // --- Cargar lista de aires acondicionados (Refactorizado con useCallback y AbortController) ---
  const fetchAiresList = useCallback(async (signal?: AbortSignal) => {
    // No establecer loading/error aquí directamente, se maneja en el caller (useEffect/handleSubmit)
    try {
      const config = signal ? { signal } : {}; // Configuración de Axios con señal de aborto
      const response = await api.get<AireAcondicionadoListItem[]>('/aires', config);

      // PRIMERO: Verificar si fue abortada ANTES de procesar
      if (signal?.aborted) {
        console.log('fetchAiresList: Abortada antes de procesar respuesta.');
        return; // No continuar si fue abortada
      }

      const responseData = response.data;
      console.log("fetchAiresList: Valor de responseData:", responseData); // Log para depuración
      const isArr = Array.isArray(responseData); // Guardar resultado de la verificación
      console.log("fetchAiresList: Resultado Array.isArray:", isArr); // Log para depuración

      // SEGUNDO: Procesar solo si NO fue abortada
      if (isArr) {
        console.log("fetchAiresList: Array.isArray es TRUE. Actualizando estado...");
        setAiresList(responseData);
        setError(null); // Limpiar error en éxito
      } else {
        // Si Array.isArray dio false, loguear el error
        console.error("fetchAiresList: Array.isArray es FALSE. Unexpected response format for /aires (expected array):", responseData);
        setAiresList([]); // Establecer lista vacía
        setError("Formato de respuesta inesperado del servidor al listar aires.");
      }

    } catch (error: any) {
      // Ignorar errores específicos de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('fetchAiresList: Petición abortada (catch).');
        // No establecer error si fue abortada
      } else {
        // Manejar otros errores (red, servidor, etc.) solo si no fue abortada
        // Verificar la señal aquí también por si acaso
        if (!signal?.aborted) {
            console.error('fetchAiresList: Error al cargar lista de aires:', error);
            setError(error.response?.data?.mensaje || error.message || 'Error al cargar los aires acondicionados');
            setAiresList([]); // Limpiar lista en caso de error real
        } else {
             console.log('fetchAiresList: Error capturado pero la petición ya estaba abortada.');
        }
      }
    } finally {
      // Quitar el loading solo si la petición no fue abortada
      // Esto es crucial para que el loading no se quite prematuramente en StrictMode
      if (!signal?.aborted) {
        console.log("fetchAiresList: Finalizando carga (no abortada).");
        setLoading(false);
      } else {
        console.log("fetchAiresList: Finalizando carga (abortada).");
      }
    }
  }, []); // Array de dependencias vacío, ya que `api` se asume estable

  // useEffect para llamar a fetchAiresList en el montaje inicial y manejar limpieza
  useEffect(() => {
    console.log("Aires.tsx: Ejecutando useEffect de carga inicial.");
    const controller = new AbortController(); // Crear controlador para esta ejecución del efecto
    setLoading(true); // Indicar carga al inicio del efecto
    setError(null);   // Limpiar errores previos al iniciar carga
    fetchAiresList(controller.signal); // Llamar a la función de carga con la señal

    // Función de limpieza que se ejecuta cuando el componente se desmonta o el efecto se re-ejecuta
    return () => {
      console.log("Aires.tsx: Limpiando efecto, abortando fetch...");
      controller.abort(); // Cancelar la petición en curso
    };
  }, [fetchAiresList]); // Depender de la función estable fetchAiresList

  // --- Handlers para interacciones del usuario ---

  // Manejar cambios en los inputs del formulario
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // Obtener el estado 'checked' solo si es un checkbox
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prevData => ({
      ...prevData,
      // Asignar 'checked' si es checkbox, 'value' parseado si es número, o 'value' directamente
      [name]: isCheckbox
              ? checked
              : type === 'number'
              ? (value === '' ? null : parseFloat(value)) // Convertir a número o null si está vacío
              : value
    }));
  }, []);

  // Abrir modal para agregar un nuevo aire
  const handleAdd = useCallback(() => {
    // Resetear formData a valores por defecto para un nuevo aire
    setFormData({
      nombre: '',
      ubicacion: '',
      fecha_instalacion: formatDate(new Date().toISOString(), true), // Fecha actual
      tipo: '',
      toneladas: null,
      evaporadora_operativa: true, // Valor por defecto
      evaporadora_marca: '',
      evaporadora_modelo: '',
      evaporadora_serial: '',
      evaporadora_codigo_inventario: '',
      evaporadora_ubicacion_instalacion: '',
      condensadora_operativa: true, // Valor por defecto
      condensadora_marca: '',
      condensadora_modelo: '',
      condensadora_serial: '',
      condensadora_codigo_inventario: '',
      condensadora_ubicacion_instalacion: '',
    });
    setModalTitle('Agregar Aire Acondicionado');
    setFormMode('add');
    setEditError(null); // Limpiar errores previos del modal
    setShowEditModal(true); // Mostrar modal de edición/creación
    setShowViewModal(false); // Asegurar que el modal de vista esté cerrado
  }, [formatDate]); // Depende de formatDate

  // Abrir modal para editar un aire existente y cargar sus detalles completos
  const handleEdit = useCallback(async (aireListItem: AireAcondicionadoListItem) => {
    setFormMode('edit');
    setModalTitle('Editar Aire Acondicionado');
    setEditError(null);
    setShowViewModal(false);

    // Pre-llenar el formulario con datos básicos de la lista mientras cargan los detalles
    setFormData({
        id: aireListItem.id,
        nombre: aireListItem.nombre,
        ubicacion: aireListItem.ubicacion,
        fecha_instalacion: formatDate(aireListItem.fecha_instalacion, true),
        // Otros campos se cargarán desde la API
    });
    setLoadingEditDetails(true); // Indicar carga de detalles
    setShowEditModal(true); // Mostrar modal

    try {
      // Llamar a la API para obtener los detalles completos del aire por ID
      const response = await api.get<AireAcondicionado>(`/aires/${aireListItem.id}`); // No necesita AbortController
      const fullDetails = response.data;

      // Validar que la respuesta sea un objeto válido con ID
      if (fullDetails && typeof fullDetails === 'object' && fullDetails.id) {
          // Actualizar formData con los detalles completos recibidos
          setFormData({
            ...fullDetails,
            // Re-formatear fecha por si viene en formato diferente
            fecha_instalacion: formatDate(fullDetails.fecha_instalacion, true),
            // Asegurar que toneladas sea número o null (manejar NaN)
            toneladas: (typeof fullDetails.toneladas === 'number' && !isNaN(fullDetails.toneladas)) ? fullDetails.toneladas : null,
            // Asegurar que los campos booleanos sean booleanos
            evaporadora_operativa: !!fullDetails.evaporadora_operativa,
            condensadora_operativa: !!fullDetails.condensadora_operativa,
          });
      } else {
          // Lanzar error si la respuesta no es válida
          throw new Error("Formato de respuesta inválido al cargar detalles para editar.");
      }
    } catch (error: any) {
      console.error(`Error al cargar detalles para editar aire ${aireListItem.id}:`, error);
      // Mostrar error en el modal de edición
      setEditError(error.response?.data?.mensaje || error.message || `Error al cargar detalles para editar.`);
      // Considerar cerrar el modal si la carga falla catastróficamente
      // setShowEditModal(false);
    } finally {
      setLoadingEditDetails(false); // Finalizar carga de detalles
    }
  }, [formatDate]); // Depende de formatDate

  // Eliminar un aire acondicionado
  const handleDelete = useCallback(async (id: number) => {
    // Pedir confirmación al usuario
    if (window.confirm('¿Está seguro de eliminar este aire acondicionado? Esta acción no se puede deshacer.')) {
      const originalList = [...airesList]; // Guardar estado actual por si hay que revertir
      setAiresList(prevList => prevList.filter(aire => aire.id !== id)); // Actualización optimista de la UI
      setError(null); // Limpiar error general previo

      try {
        // Llamar a la API para eliminar el registro
        await api.delete(`/aires/${id}`); // No necesita AbortController
        // Si la llamada es exitosa, la UI ya está actualizada
      } catch (error: any) {
        console.error('Error al eliminar aire:', error);
        // Mostrar error general
        setError(error.response?.data?.mensaje || 'Error al eliminar el aire acondicionado');
        setAiresList(originalList); // Revertir la actualización optimista si falla la API
      }
    }
  }, [airesList]); // Depende de airesList para revertir

  // Enviar formulario (Agregar o Editar) al backend
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir recarga de página
    setEditError(null); // Limpiar errores previos del modal

    // --- Validación de campos requeridos (incluyendo únicos) ---
    const requiredFields: (keyof AireAcondicionado)[] = [
        'nombre', 'ubicacion', 'fecha_instalacion',
        'evaporadora_serial', 'evaporadora_codigo_inventario',
        'condensadora_serial', 'condensadora_codigo_inventario'
    ];
    const missingFields = requiredFields.filter(field => {
        const value = formData[field];
        // Considerar campo vacío o null/undefined como faltante
        return value === null || value === undefined || value === '';
    });

    if (missingFields.length > 0) {
        // Crear mensaje de error legible
        const fieldNames = missingFields.map(field => {
            switch(field) {
                case 'nombre': return 'Nombre';
                case 'ubicacion': return 'Ubicación';
                case 'fecha_instalacion': return 'Fecha de Instalación';
                case 'evaporadora_serial': return 'Serial Evap.';
                case 'evaporadora_codigo_inventario': return 'Inventario Evap.';
                case 'condensadora_serial': return 'Serial Cond.';
                case 'condensadora_codigo_inventario': return 'Inventario Cond.';
                default: return field; // Nombre técnico si no hay mapeo
            }
        }).join(', ');
        setEditError(`Los siguientes campos son requeridos: ${fieldNames}.`);
        return; // Detener el envío si faltan campos
    }
    // --- Fin Validación ---

    // Preparar el payload para enviar a la API
    const payload: Partial<AireAcondicionado> = {
        ...formData,
        // Asegurar formato YYYY-MM-DD para la fecha
        fecha_instalacion: formData.fecha_instalacion ? formData.fecha_instalacion.split('T')[0] : '',
        // Asegurar que toneladas sea número o null
        toneladas: (formData.toneladas !== null && formData.toneladas !== undefined && !isNaN(Number(formData.toneladas))) ? Number(formData.toneladas) : null,
        // Asegurar que los campos operativos sean booleanos
        evaporadora_operativa: !!formData.evaporadora_operativa,
        condensadora_operativa: !!formData.condensadora_operativa,
    };
    // No enviar 'id' al crear uno nuevo
    if (formMode === 'add') { delete payload.id; }

    console.log("Enviando payload:", payload);
    // setLoadingSubmit(true); // Opcional: activar estado de carga del botón/formulario

    try {
      let response; // Declarar fuera para acceso general
      // Determinar si es una operación POST (agregar) o PUT (editar)
      if (formMode === 'add') {
        response = await api.post<{ success: boolean; mensaje: string; data: AireAcondicionado }>('/aires', payload);
        // Verificar si el backend indica éxito
        if (!response.data?.success) {
            // Capturar error específico de duplicado si el backend lo envía
            if (response.data?.mensaje?.toLowerCase().includes('duplicate') || response.data?.mensaje?.toLowerCase().includes('único') || response.data?.mensaje?.toLowerCase().includes('ya existe')) {
                 throw new Error(`Error: Ya existe un registro con ese Serial o Código de Inventario.`);
            }
            // Lanzar error genérico si no es de duplicado
            throw new Error(response.data?.mensaje || "Error al agregar aire.");
        }
      } else if (formMode === 'edit' && formData.id) {
        response = await api.put<{ success: boolean; mensaje: string; data?: AireAcondicionado }>(`/aires/${formData.id}`, payload);
         // Verificar si el backend indica éxito
         if (!response.data?.success) {
             // Capturar error específico de duplicado si el backend lo envía
             if (response.data?.mensaje?.toLowerCase().includes('duplicate') || response.data?.mensaje?.toLowerCase().includes('único') || response.data?.mensaje?.toLowerCase().includes('ya existe')) {
                 throw new Error(`Error: Ya existe otro registro con ese Serial o Código de Inventario.`);
            }
            // Lanzar error genérico si no es de duplicado
            throw new Error(response.data?.mensaje || "Error al actualizar aire.");
        }
      } else {
          // Seguridad: Lanzar error si el modo o ID no son válidos para editar
          throw new Error("Operación inválida: Modo de formulario o ID incorrecto para editar.");
      }

      // Si la operación fue exitosa en el backend:
      setShowEditModal(false); // Cerrar el modal
      setLoading(true); // Indicar carga general
      setError(null);   // Limpiar error general al iniciar recarga
      await fetchAiresList(); // Recargar la lista para reflejar los cambios (SIN señal de aborto)

    } catch (error: any) {
      console.error('Error al guardar:', error);
      // Mostrar el mensaje de error específico (incluyendo el de duplicado) en el modal
      setEditError(error.message || 'Error de red o al procesar la solicitud');
      // No cerrar el modal en caso de error, permitir al usuario corregir
    } finally {
        // setLoadingSubmit(false); // Desactivar estado de carga del botón/formulario
    }
  }, [formData, formMode, fetchAiresList]); // Depender de fetchAiresList para recargar

  // Abrir modal de vista de detalles al hacer clic en una fila
  const handleRowClick = useCallback(async (id: number) => {
    setShowViewModal(true); // Mostrar modal de vista
    setLoadingDetails(true); // Indicar carga de detalles
    setViewError(null); // Limpiar errores previos del modal de vista
    setSelectedAireDetails(null); // Limpiar detalles previos
    try {
      // Obtener detalles completos del aire por ID
      const response = await api.get<AireAcondicionado>(`/aires/${id}`); // No necesita AbortController
      // Validar la respuesta
      if (response.data && typeof response.data === 'object' && response.data.id) {
          setSelectedAireDetails(response.data); // Guardar detalles en el estado
      } else {
          throw new Error("Formato de respuesta inválido al cargar detalles.");
      }
    } catch (error: any) {
      console.error(`Error al cargar detalles del aire ${id}:`, error);
      // Mostrar error en el modal de vista
      setViewError(error.response?.data?.mensaje || error.message || `Error al cargar detalles.`);
    } finally {
      setLoadingDetails(false); // Finalizar carga de detalles
    }
  }, []); // Sin dependencias externas

  // --- Renderizado del Componente ---
  return (
    <div>
      {/* Encabezado de la página */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1>Aires Acondicionados</h1>
        {/* Botón para agregar, visible solo si el usuario tiene permisos */}
        {canManage && (
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Agregar Aire
          </Button>
        )}
      </div>

      {/* Alerta para errores generales (carga de lista, eliminación) */}
      {error && ( // Mostrar error general si existe
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tarjeta principal que contiene la tabla */}
      <Card className="dashboard-card">
        <Card.Body>
          {/* Componente de tabla para mostrar la lista de aires */}
          <AiresTable
            airesList={airesList}
            loading={loading}
            error={error} // Pasar error por si la tabla necesita mostrar algo
            canManage={canManage} // Pasar permisos para mostrar/ocultar botones
            onRowClick={handleRowClick} // Handler para clic en fila
            onEdit={handleEdit} // Handler para botón editar
            onDelete={handleDelete} // Handler para botón eliminar
            onAdd={handleAdd} // Handler para botón en estado vacío
            formatDate={formatDate} // Pasar helper de formato de fecha
          />
        </Card.Body>
      </Card>

      {/* --- Modales --- */}

      {/* Modal para Agregar o Editar Aire */}
      <AiresAddEditModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)} // Cierra el modal
        modalTitle={modalTitle} // Título dinámico ('Agregar' o 'Editar')
        formData={formData} // Datos actuales del formulario
        formMode={formMode} // 'add' o 'edit'
        loadingEditDetails={loadingEditDetails} // Indicador de carga para editar
        editError={editError} // Error específico del modal para mostrar
        onSubmit={handleSubmit} // Handler para enviar el formulario
        onChange={handleChange} // Handler para cambios en inputs
      />

      {/* Modal para Ver Detalles del Aire */}
      <AiresViewModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)} // Cierra el modal
        selectedAireDetails={selectedAireDetails} // Datos del aire a mostrar
        loadingDetails={loadingDetails} // Indicador de carga
        viewError={viewError} // Error específico del modal para mostrar
        formatDate={formatDate} // Pasar helper de formato de fecha
      />
    </div>
  );
};

export default Aires;
