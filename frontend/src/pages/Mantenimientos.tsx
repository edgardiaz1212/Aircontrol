// src/pages/Mantenimientos.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FiPlus,
  FiTool,
} from "react-icons/fi";
import api from "../services/api";
import { useAppContext } from "../context/AppContext";

// Importar los componentes extraídos
import MantenimientoFilter from "../components/Mantenimientos/MantenimientoFilter";
import MantenimientosTable from "../components/Mantenimientos/MantenimientosTable";
import MantenimientoAddModal from "../components/Mantenimientos/MantenimientoAddModal";
import MantenimientoViewModal from "../components/Mantenimientos/MantenimientoViewModal";
import MantenimientoImagenModal from "../components/Mantenimientos/MantenimientoImagenModal";

// --- Interfaces (EXPORTADAS desde este archivo) ---
export interface Mantenimiento {
  id: number;
  aire_id?: number | null; // Permite null/undefined
  otro_equipo_id?: number | null; // Permite null/undefined
  fecha: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
  tiene_imagen: boolean;
  // Campos añadidos por el frontend para mostrar info unificada
  equipo_nombre?: string;
  equipo_ubicacion?: string;
  equipo_tipo?: string;
}

export interface AireAcondicionadoOption {
  id: number;
  nombre: string;
  ubicacion: string;
}

export interface OtroEquipoOption {
  id: number;
  nombre: string;
  tipo: string; // 'Motogenerador', 'UPS', etc.
}

// Interfaz para los datos del formulario de agregar
// Mantenemos ambos IDs, el modal se encargará de cuál está activo
interface MantenimientoFormData {
  aire_id: string; // ID del Aire seleccionado (o "" si se selecciona Otro Equipo)
  otro_equipo_id: string; // ID del Otro Equipo seleccionado (o "" si se selecciona Aire)
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
}

const Mantenimientos: React.FC = () => {
  const { user } = useAppContext();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [aires, setAires] = useState<AireAcondicionadoOption[]>([]);
  const [otrosEquipos, setOtrosEquipos] = useState<OtroEquipoOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAire, setFiltroAire] = useState<number | null>(null); // Filtro actual solo soporta aires

  // Estados de los modales
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImagenModal, setShowImagenModal] = useState<boolean>(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);

  // Estado del formulario y carga
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [formData, setFormData] = useState<MantenimientoFormData>({
    aire_id: "",
    otro_equipo_id: "",
    tipo_mantenimiento: "",
    descripcion: "",
    tecnico: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null); // Inicializar con null

  const canEdit = user?.rol === "admin" || user?.rol === "supervisor";

  // --- Cargar datos iniciales (Aires, Otros Equipos, Mantenimientos) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let fetchedAires: AireAcondicionadoOption[] = [];
      let fetchedOtrosEquipos: OtroEquipoOption[] = [];

      try {
        // --- 1. Cargar Aires ---
        try {
            const airesResponse = await api.get("/aires");
            const potentialAiresData = airesResponse.data;
            if (Array.isArray(potentialAiresData)) {
                const validatedAires = potentialAiresData.map(item => ({
                    id: item.id ?? 0,
                    nombre: item.nombre ?? 'Sin Nombre',
                    ubicacion: item.ubicacion ?? 'Sin Ubicación'
                }));
                setAires(validatedAires);
                fetchedAires = validatedAires; // Guardar para usar después
            } else {
                throw new Error("Formato inesperado al cargar aires.");
            }
        } catch (apiError: any) {
             console.error("Error cargando aires:", apiError);
             setAires([]); // Asegurar estado vacío
             // Establecer error y detener si la carga de aires es crítica
             setError(apiError.response?.data?.mensaje || "Error de red al cargar lista de aires.");
             setLoading(false);
             return; // Detener fetchData si falla la carga de aires
        }

        // --- 2. Cargar Otros Equipos (después de cargar aires) ---
        try {
            const otrosEquiposResponse = await api.get("/otros-equipos");
            const potentialOtrosData = otrosEquiposResponse.data;
            if (Array.isArray(potentialOtrosData)) {
                 const validatedOtros = potentialOtrosData.map(item => ({
                    id: item.id ?? 0,
                    nombre: item.nombre ?? 'Sin Nombre',
                    tipo: item.tipo ?? 'Desconocido'
                 }));
                setOtrosEquipos(validatedOtros);
                fetchedOtrosEquipos = validatedOtros; // Guardar para usar después
            } else {
                // No lanzar error fatal, pero registrar advertencia
                console.warn("Respuesta inesperada al cargar otros equipos:", potentialOtrosData);
                setOtrosEquipos([]);
                setError(prev => prev ? `${prev} | Advertencia: No se cargaron otros equipos.` : "Advertencia: No se cargaron otros equipos.");
            }
        } catch (apiError: any) {
            console.error("Error cargando otros equipos:", apiError);
            setOtrosEquipos([]);
            setError(prev => prev ? `${prev} | ${apiError.response?.data?.mensaje || "Error red otros equipos."}` : apiError.response?.data?.mensaje || "Error red otros equipos.");
        }

        // --- 3. Cargar Mantenimientos (usando los datos de equipos ya cargados) ---
        let url = "/mantenimientos";
        // Aplicar filtro si existe y es válido (asumiendo filtro solo por aire_id por ahora)
        if (filtroAire && fetchedAires.some(a => a.id === filtroAire)) {
            url += `?aire_id=${filtroAire}`;
        } else if (filtroAire) {
            console.warn(`Filtro aire_id ${filtroAire} inválido. Mostrando todos.`);
            setFiltroAire(null); // Resetear filtro inválido
        }

        const mantenimientosResponse = await api.get(url);
        const mantenimientosData = mantenimientosResponse.data || [];

        if (!Array.isArray(mantenimientosData)) {
            throw new Error("Formato inesperado al cargar mantenimientos.");
        }

        // Mapear mantenimientos añadiendo info del equipo correspondiente
        const mantenimientosConDetalles = mantenimientosData.map(
          (mantenimiento: Mantenimiento) => {
            let equipoNombre = "Desconocido";
            let equipoUbicacion = "Desconocida";
            let equipoTipo = "Desconocido";

            if (mantenimiento.aire_id) {
                const equipo = fetchedAires.find(a => a.id === mantenimiento.aire_id);
                if (equipo) {
                    equipoNombre = equipo.nombre;
                    equipoUbicacion = equipo.ubicacion;
                    equipoTipo = "Aire Acondicionado";
                }
            } else if (mantenimiento.otro_equipo_id) {
                const equipo = fetchedOtrosEquipos.find(o => o.id === mantenimiento.otro_equipo_id);
                if (equipo) {
                    equipoNombre = equipo.nombre;
                    // Ubicación podría no estar disponible en la lista simple de otros equipos
                    equipoUbicacion = ""; // O buscar detalles si es necesario
                    equipoTipo = equipo.tipo;
                }
            }
            return { ...mantenimiento, equipo_nombre: equipoNombre, equipo_ubicacion: equipoUbicacion, equipo_tipo: equipoTipo };
          }
        );
        setMantenimientos(mantenimientosConDetalles);

      } catch (error: any) {
        // Captura errores de carga de mantenimientos o errores lanzados manualmente
        console.error("Error en fetchData:", error);
        const message = error.response?.data?.mensaje || error.message || "Error al cargar datos.";
        setError(message);
        setMantenimientos([]); // Limpiar datos en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtroAire]); // Dependencia: Recargar cuando cambie el filtro

  // --- Handlers ---

  const handleFiltrarPorAire = useCallback((aireId: number | null) => {
    setFiltroAire(aireId);
  }, []);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Si se cambia un ID, limpiar el otro ID para evitar enviar ambos
    if (name === 'aire_id' && value !== "") {
        setFormData(prev => ({ ...prev, otro_equipo_id: "" }));
    } else if (name === 'otro_equipo_id' && value !== "") {
        setFormData(prev => ({ ...prev, aire_id: "" }));
    }
  }, []);

  const handleAdd = useCallback(() => {
    // Resetear formulario, seleccionando el primer aire por defecto si existe
    setFormData({
      aire_id: aires.length > 0 ? aires[0].id.toString() : "",
      otro_equipo_id: "", // Asegurar que esté vacío
      tipo_mantenimiento: "",
      descripcion: "",
      tecnico: "",
    });
    // Resetear input de archivo si existe
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setError(null); // Limpiar errores previos
    setLoadingSubmit(false);
    setShowAddModal(true);
    setShowViewModal(false); // Cerrar otros modales
  }, [aires]); // Depende de 'aires' para el valor inicial

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm("¿Está seguro de eliminar este registro de mantenimiento?")) {
      const originalMantenimientos = [...mantenimientos];
      setMantenimientos(prev => prev.filter((m) => m.id !== id)); // Optimistic UI
      setError(null);
      try {
        await api.delete(`/mantenimientos/${id}`);
        // Éxito
      } catch (error: any) {
        console.error("Error al eliminar mantenimiento:", error);
        setError(error.response?.data?.mensaje || "Error al eliminar el registro.");
        setMantenimientos(originalMantenimientos); // Revertir
      }
    }
  }, [mantenimientos]);

  const handleShowImagen = useCallback(async (id: number) => {
    setError(null);
    setImagenSeleccionada(null); // Limpiar imagen previa
    setShowImagenModal(true); // Mostrar modal (puede mostrar un spinner interno)
    try {
      const response = await api.get(`/mantenimientos/${id}/imagen`);
      if (response.data?.success && response.data?.imagen_base64) {
        setImagenSeleccionada(response.data.imagen_base64);
      } else {
        setImagenSeleccionada("error"); // Indicar que no se pudo cargar
      }
    } catch (error: any) {
      console.error("Error al cargar imagen:", error);
      setError(error.response?.data?.mensaje || "Error al cargar la imagen.");
      setImagenSeleccionada("error");
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Limpiar errores generales y del modal
    setLoadingSubmit(true);

    // --- Validación ---
    if (!formData.tipo_mantenimiento || !formData.descripcion || !formData.tecnico) {
        setError("Tipo, Descripción y Técnico son requeridos.");
        setLoadingSubmit(false);
        return;
    }
    // Validar que exactamente UN equipo esté seleccionado
    const aireSeleccionado = formData.aire_id && formData.aire_id !== "";
    const otroSeleccionado = formData.otro_equipo_id && formData.otro_equipo_id !== "";

    if (aireSeleccionado && otroSeleccionado) {
        setError("Seleccione solo un Aire Acondicionado O un Otro Equipo, no ambos.");
        setLoadingSubmit(false);
        return;
    }
    if (!aireSeleccionado && !otroSeleccionado) {
        setError("Debe seleccionar un equipo (Aire u Otro).");
        setLoadingSubmit(false);
        return;
    }
    // --- Fin Validación ---

    try {
      const formDataObj = new FormData();
      // Añadir el ID correcto al FormData
      if (aireSeleccionado) {
          formDataObj.append("aire_id", formData.aire_id);
      } else if (otroSeleccionado) {
          formDataObj.append("otro_equipo_id", formData.otro_equipo_id);
      }
      // Añadir resto de campos
      formDataObj.append("tipo_mantenimiento", formData.tipo_mantenimiento);
      formDataObj.append("descripcion", formData.descripcion);
      formDataObj.append("tecnico", formData.tecnico);
      // Añadir archivo si existe
      if (fileInputRef.current?.files?.[0]) {
        formDataObj.append("imagen_file", fileInputRef.current.files[0]);
      }

      // Enviar al backend
      const response = await api.post("/mantenimientos", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const nuevoMantenimientoCompleto: Mantenimiento | undefined = response.data?.data;

      if (nuevoMantenimientoCompleto?.id) {
          // Enriquecer con datos locales para mostrar inmediatamente
          let equipoNombre = "Desconocido";
          let equipoUbicacion = "Desconocida";
          let equipoTipo = "Desconocido";

          if (nuevoMantenimientoCompleto.aire_id) {
              const equipo = aires.find((a) => a.id === nuevoMantenimientoCompleto.aire_id);
              equipoNombre = equipo?.nombre || "Desconocido";
              equipoUbicacion = equipo?.ubicacion || "Desconocida";
              equipoTipo = "Aire Acondicionado";
          } else if (nuevoMantenimientoCompleto.otro_equipo_id) {
              const equipo = otrosEquipos.find((o) => o.id === nuevoMantenimientoCompleto.otro_equipo_id);
              equipoNombre = equipo?.nombre || "Desconocido";
              equipoTipo = equipo?.tipo || "Otro Equipo";
          }

          const finalNuevoMantenimiento: Mantenimiento = {
              ...nuevoMantenimientoCompleto,
              equipo_nombre: equipoNombre,
              equipo_ubicacion: equipoUbicacion,
              equipo_tipo: equipoTipo,
          };

          // Añadir a la lista (considerando filtro actual)
          // Por ahora, el filtro solo aplica a aires
          if (!filtroAire || finalNuevoMantenimiento.aire_id === filtroAire) {
               setMantenimientos(prev => [finalNuevoMantenimiento, ...prev]);
          }

          setShowAddModal(false); // Cerrar modal
      } else {
          throw new Error("Respuesta inesperada del servidor al agregar mantenimiento.");
      }

    } catch (error: any) {
      console.error("Error al guardar mantenimiento:", error);
      const message = error.response?.data?.mensaje || error.message || "Error al guardar el registro.";
      setError(message); // Mostrar error (se mostrará en la alerta general o en el modal si se pasa)
    } finally {
        setLoadingSubmit(false);
    }
  }, [formData, aires, otrosEquipos, filtroAire]); // Dependencias

  const formatearFechaHora = useCallback((fechaStr: string | undefined): string => {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';
        return fecha.toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    } catch (e) { return 'Error fecha'; }
  }, []);

  const getBadgeColor = useCallback((tipo: string | undefined): string => {
    switch (tipo?.toLowerCase()) {
      case "preventivo": return "success";
      case "correctivo": return "danger";
      case "predictivo": return "info";
      case "instalación": return "primary";
      case "limpieza": return "warning";
      default: return "secondary";
    }
  }, []);

  const handleShowViewModal = useCallback((mantenimiento: Mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowViewModal(true);
    setShowAddModal(false);
  }, []);

  // --- Renderizado ---
  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1>Mantenimientos</h1>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <MantenimientoFilter
            aires={aires} // Pasar aires para el filtro
            filtroAire={filtroAire}
            onFilterChange={handleFiltrarPorAire}
          />
          {canEdit && (
            <Button variant="primary" onClick={handleAdd}>
              <FiPlus className="me-2" /> Registrar Mantenimiento
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de Error General */}
      {error && !loadingSubmit && ( // No mostrar error general si el error es del submit (se muestra en modal)
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Card Principal */}
      <Card className="dashboard-card">
        <Card.Body>
          {/* Tabla de Mantenimientos */}
          <MantenimientosTable
            mantenimientos={mantenimientos}
            loading={loading}
            canEdit={canEdit}
            onShowViewModal={handleShowViewModal}
            onShowImagen={handleShowImagen}
            onDelete={handleDelete}
            getBadgeColor={getBadgeColor}
            formatearFechaHora={formatearFechaHora}
          />
          {/* Mensaje y botón para estado vacío */}
          {!loading && mantenimientos.length === 0 && (
            <div className="text-center p-5">
              <FiTool size={50} className="text-muted mb-3" />
              <h4>
                No hay registros de mantenimiento{" "}
                {filtroAire
                  ? `para ${aires.find((a) => a.id === filtroAire)?.nombre || "equipo seleccionado"}`
                  : ""}
              </h4>
              {canEdit && (
                <Button variant="primary" className="mt-3" onClick={handleAdd}>
                  <FiPlus className="me-2" /> Registrar primer mantenimiento
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modales */}
      <MantenimientoAddModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        aires={aires}
        otrosEquipos={otrosEquipos} // Pasar otros equipos al modal
        formData={formData}
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleChange} // Pasar el handler unificado
        onSubmit={handleSubmit}
        loadingSubmit={loadingSubmit}
        error={error} // Pasar el error para mostrarlo dentro del modal
        clearError={() => setError(null)} // Permitir limpiar el error desde el modal
      />

      <MantenimientoImagenModal
        show={showImagenModal}
        onHide={() => setShowImagenModal(false)}
        imagenUrl={imagenSeleccionada}
      />

      <MantenimientoViewModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        mantenimiento={selectedMantenimiento}
        onShowImagen={(mantenimientoId) => {
            // Asegurar que el ID es un número antes de llamar
            if (typeof mantenimientoId === 'number') {
                handleShowImagen(mantenimientoId);
            }
        }}
        getBadgeColor={getBadgeColor}
        formatearFechaHora={formatearFechaHora}
      />
    </div>
  );
};

export default Mantenimientos;
