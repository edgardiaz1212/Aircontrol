import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

// Importar los nuevos componentes
import LecturasFilter from '../components/lecturas/LecturasFilter';
import LecturasTable from '../components/lecturas/LecturasTable';
import LecturasAddModal from '../components/lecturas/LecturasAddModal';

// --- Interfaces (Exportar si se usan en otros lugares o mover a types.ts) ---
export interface Lectura {
  id: number;
  aire_id: number;
  fecha: string; // '2023-04-09 14:00:00'
  temperatura: number;
  humedad: number;
  aire_nombre?: string;
  ubicacion?: string;
}

export interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

export interface UmbralConfiguracion {
  id: number;
  nombre: string;
  es_global: boolean;
  aire_id?: number | null;
  temp_min: number;
  temp_max: number;
  hum_min: number;
  hum_max: number;
  notificar_activo: boolean;
  aire_nombre?: string; // Opcional, si viene del backend
  ubicacion?: string;   // Opcional, si viene del backend
}

// --- Componente Principal (Contenedor) ---
const Lecturas: React.FC = () => {
  const { user } = useAppContext();
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAire, setFiltroAire] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Estado para el envío del form
  const [umbrales, setUmbrales] = useState<UmbralConfiguracion[]>([]); 
  const [formData, setFormData] = useState({
    aire_id: '',
    fecha: '',
    hora: '',
    temperatura: '',
    humedad: ''
  });

  // Verificar si el usuario puede eliminar lecturas
  const canDelete = user?.rol === 'admin' || user?.rol === 'supervisor';

  // Cargar aires y lecturas
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- USAR Promise.all ---
        let urlLecturas = '/lecturas';
        const paramsLecturas: { aire_id?: number } = {};
        if (filtroAire) {
          paramsLecturas.aire_id = filtroAire;
        }

        // Ejecutar TODAS las peticiones en paralelo
        const [airesResponse, lecturasResponse, umbralesResponse] = await Promise.all([ // <--- Añadir petición de umbrales
          api.get('/aires'),
          api.get(urlLecturas, { params: paramsLecturas }),
          api.get('/umbrales') // <--- Obtener todos los umbrales
        ]);

        // --- Procesar Aires PRIMERO ---
        const airesData = airesResponse.data?.data || airesResponse.data || [];
        // ... (validación y setAires) ...
        setAires(airesData);


        // --- Procesar Umbrales ---
        const umbralesData = umbralesResponse.data?.data || umbralesResponse.data || []; // <--- Procesar respuesta de umbrales
        if (!Array.isArray(umbralesData)) {
            console.error("Respuesta inesperada para /umbrales:", umbralesResponse.data);
            setUmbrales([]);
        } else {
            setUmbrales(umbralesData); // <--- Guardar umbrales en el estado
        }


        // --- Procesar Lecturas DESPUÉS ---
        const lecturasData = lecturasResponse.data?.data || lecturasResponse.data || [];
        // ... (validación) ...

        // Mapear lecturas usando airesData (como antes)
        const lecturasConDetalles = lecturasData.map((lectura: Lectura) => {
          const aire = airesData.find((a: AireAcondicionado) => a.id === lectura.aire_id);
          return {
            ...lectura,
            aire_nombre: aire?.nombre || 'Desconocido',
            ubicacion: aire?.ubicacion || 'Desconocida'
          };
        });

        // Ordenar (como antes)
        lecturasConDetalles.sort((a: Lectura, b: Lectura) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        setLecturas(lecturasConDetalles);

      } catch (err: any) {
        // ... (manejo de errores) ...
        setUmbrales([]); // Limpiar umbrales en error también
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtroAire]) // Recargar solo cuando cambia el filtro


  // Filtrar por aire
  const handleFiltrarPorAire = useCallback((aireId: number | null) => {
    setFiltroAire(aireId);
  }, []);

  // Manejar cambios en el formulario
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Abrir modal para agregar
  const handleAdd = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5); // HH:MM

    setFormData({
      aire_id: aires.length > 0 ? aires[0].id.toString() : '', // Seleccionar el primero por defecto
      fecha: today,
      hora: now,
      temperatura: '',
      humedad: ''
    });
    setError(null); // Limpiar errores previos al abrir el modal
    setShowModal(true);
  }, [aires]); // Depende de 'aires' para el valor por defecto

  // Eliminar lectura
  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta lectura?')) {
      // Optimistic UI update
      const originalLecturas = [...lecturas];
      setLecturas(prev => prev.filter(lectura => lectura.id !== id));
      setError(null);

      try {
        await api.delete(`/lecturas/${id}`);
        // Éxito: la UI ya está actualizada
      } catch (error) {
        console.error('Error al eliminar lectura:', error);
        setError('Error al eliminar la lectura. Intente de nuevo.');
        // Revertir en caso de error
        setLecturas(originalLecturas);
      }
    }
  }, [lecturas]);

  // Enviar formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validaciones básicas
      if (!formData.aire_id || !formData.fecha || !formData.hora || formData.temperatura === '' || formData.humedad === '') {
          throw new Error("Todos los campos son requeridos.");
      }
      const temperaturaNum = parseFloat(formData.temperatura);
      const humedadNum = parseFloat(formData.humedad);
      if (isNaN(temperaturaNum) || isNaN(humedadNum)) {
          throw new Error("Temperatura y Humedad deben ser números válidos.");
      }

      const payload = {
        aire_id: parseInt(formData.aire_id),
        // Combinar fecha y hora correctamente para el backend (ajustar si es necesario)
        fecha_hora: `${formData.fecha} ${formData.hora}:00`, // Asume que el backend espera 'YYYY-MM-DD HH:MM:SS'
        temperatura: temperaturaNum,
        humedad: humedadNum
      };

      const response = await api.post('/lecturas', payload);

      // Obtener aire correspondiente
      const aire = aires.find(a => a.id === payload.aire_id);

      // Crear nueva lectura con datos completos (usar la fecha/hora devuelta por el backend si es diferente)
      const nuevaLectura: Lectura = {
        id: response.data.id, // Asume que el backend devuelve el ID
        aire_id: payload.aire_id,
        fecha: response.data.fecha || payload.fecha_hora, // Usar fecha del backend si existe
        temperatura: payload.temperatura,
        humedad: payload.humedad,
        aire_nombre: aire?.nombre || 'Desconocido',
        ubicacion: aire?.ubicacion || 'Desconocida'
      };

      // Añadir al principio y re-ordenar (o simplemente añadir y dejar que el sort del useEffect lo maneje en la próxima carga)
      setLecturas(prev => [nuevaLectura, ...prev].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      setShowModal(false);

    } catch (err: any) {
      console.error('Error al guardar lectura:', err);
      setError(err.response?.data?.mensaje || err.message || 'Error al guardar la lectura.');
      // No cerrar el modal en caso de error
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, aires]); // Dependencias

  // Formatear fecha (movido a useCallback para estabilidad de referencia)
  const formatearFecha = useCallback((fechaStr: string | undefined): string => {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';
        return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", fechaStr, e);
        return 'Error fecha';
    }
  }, []);

  // Formatear hora (movido a useCallback para estabilidad de referencia)
  const formatearHora = useCallback((fechaStr: string | undefined): string => {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Hora inválida';
        return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        console.error("Error formatting time:", fechaStr, e);
        return 'Error hora';
    }
  }, []);


  return (
    <div>
      {/* Encabezado y Filtros */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1>Lecturas</h1>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <LecturasFilter
            aires={aires}
            filtroAire={filtroAire}
            onFilterChange={handleFiltrarPorAire}
          />
          <Button variant="primary" onClick={handleAdd}>
            <FiPlus className="me-2" /> Agregar Lectura
          </Button>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Card con la Tabla */}
      <Card className="dashboard-card">
        <Card.Body>
          <LecturasTable
            lecturas={lecturas}
            loading={loading}
            canDelete={canDelete}
            onDelete={handleDelete}
            onAdd={handleAdd} // Pasar la función para el botón dentro de la tabla vacía
            formatearFecha={formatearFecha}
            formatearHora={formatearHora}
            umbrales={umbrales}
          />
        </Card.Body>
      </Card>

      {/* Modal de Agregar */}
      <LecturasAddModal
        show={showModal}
        onHide={() => setShowModal(false)}
        aires={aires}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Lecturas;
