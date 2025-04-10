import React, { useState, useEffect, useRef } from "react";
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

// Interfaces (pueden moverse a un archivo types.ts si se usan en varios lugares)
interface Mantenimiento {
  id: number;
  aire_id: number;
  fecha: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
  imagen?: string;
  tiene_imagen: boolean; 
  aire_nombre?: string;
  ubicacion?: string;
}

interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

// Interfaz para los datos del formulario de agregar
interface MantenimientoFormData {
  aire_id: string;
  tipo_mantenimiento: string;
  descripcion: string;
  tecnico: string;
}

const Mantenimientos: React.FC = () => {
  const { user } = useAppContext();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [aires, setAires] = useState<AireAcondicionado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroAire, setFiltroAire] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImagenModal, setShowImagenModal] = useState<boolean>(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedMantenimiento, setSelectedMantenimiento] = useState<Mantenimiento | null>(null);

  const [formData, setFormData] = useState<MantenimientoFormData>({
    aire_id: "",
    tipo_mantenimiento: "",
    descripcion: "",
    tecnico: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null!);

  // Verificar si el usuario puede agregar/eliminar mantenimientos
  const canEdit = user?.rol === "admin" || user?.rol === "supervisor";

  // Cargar aires y mantenimientos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar aires
        const airesResponse = await api.get("/aires");
        const airesData = airesResponse.data?.data || airesResponse.data || [];
        setAires(airesData);

        // Cargar mantenimientos
        let url = "/mantenimientos";
        if (filtroAire) {
          url += `?aire_id=${filtroAire}`;
        }
        const mantenimientosResponse = await api.get(url);
        const mantenimientosData = mantenimientosResponse.data?.data || mantenimientosResponse.data || [];

        // Añadir información del aire a cada mantenimiento
        const mantenimientosConDetalles = mantenimientosData.map(
          (mantenimiento: Mantenimiento) => {
            const aire = airesData.find(
              (a: AireAcondicionado) => a.id === mantenimiento.aire_id
            );
            return {
              ...mantenimiento,
              aire_nombre: aire?.nombre || "Desconocido",
              ubicacion: aire?.ubicacion || "Desconocida",
            };
          }
        );

        setMantenimientos(mantenimientosConDetalles);
      } catch (error: any) {
        console.error("Error al cargar datos:", error);
        const message = error.response?.data?.mensaje || "Error al cargar los datos. Verifique la conexión con el servidor.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtroAire]);

  // Filtrar por aire
  const handleFiltrarPorAire = (aireId: number | null) => {
    setFiltroAire(aireId);
  };

  // Manejar cambios en el formulario de agregar
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Abrir modal para agregar
  const handleAdd = () => {
    setFormData({
      aire_id: aires.length > 0 ? aires[0].id.toString() : "",
      tipo_mantenimiento: "",
      descripcion: "",
      tecnico: "",
    });
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setShowAddModal(true);
    setShowViewModal(false);
  };

  // Eliminar mantenimiento
  const handleDelete = async (id: number) => {
    if (
      window.confirm("¿Está seguro de eliminar este registro de mantenimiento?")
    ) {
      try {
        await api.delete(`/mantenimientos/${id}`);
        setMantenimientos(mantenimientos.filter((m) => m.id !== id));
        setError(null);
      } catch (error: any) {
        console.error("Error al eliminar mantenimiento:", error);
        const message = error.response?.data?.mensaje || "Error al eliminar el registro de mantenimiento";
        setError(message);
      }
    }
  };

  // Mostrar imagen en modal
  const handleShowImagen = async (id: number) => {
    setError(null); // Limpiar errores previos
    setImagenSeleccionada(null); // Limpiar imagen previa
    setShowImagenModal(true); // Mostrar modal (quizás con un spinner dentro)

    try {
      // Llamar al nuevo endpoint para obtener la imagen base64
      const response = await api.get(`/mantenimientos/${id}/imagen`);
      // Asumiendo que el backend devuelve { success: true, imagen_base64: "data:image/..." }
      if (response.data?.success && response.data?.imagen_base64) {
        setImagenSeleccionada(response.data.imagen_base64);
      } else {
        throw new Error(response.data?.mensaje || "No se pudo cargar la imagen.");
      }
    } catch (error: any) {
      console.error("Error al cargar imagen:", error);
      const message = error.response?.data?.mensaje || "Error al cargar la imagen.";
      setError(message);
      setShowImagenModal(false); // Ocultar modal si hay error
    }
    // Considera añadir un estado de 'loadingImagen' para el modal
  };

  // Enviar formulario de agregar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("aire_id", formData.aire_id);
      formDataObj.append("tipo_mantenimiento", formData.tipo_mantenimiento);
      formDataObj.append("descripcion", formData.descripcion);
      formDataObj.append("tecnico", formData.tecnico);

      if (
        fileInputRef.current?.files &&
        fileInputRef.current.files.length > 0
      ) {
        formDataObj.append("imagen_file", fileInputRef.current.files[0]);
      }

      const response = await api.post("/mantenimientos", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const nuevoMantenimientoCompleto: Mantenimiento = response.data.data || response.data;
      const aire = aires.find((a) => a.id === nuevoMantenimientoCompleto.aire_id);
      const finalNuevoMantenimiento = {
          ...nuevoMantenimientoCompleto,
          aire_nombre: nuevoMantenimientoCompleto.aire_nombre || aire?.nombre || "Desconocido",
          ubicacion: nuevoMantenimientoCompleto.ubicacion || aire?.ubicacion || "Desconocida",
      };

      setMantenimientos([finalNuevoMantenimiento, ...mantenimientos]);
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Error al guardar mantenimiento:", error);
      const message = error.response?.data?.mensaje || "Error al guardar el registro de mantenimiento";
      setError(message);
    }
  };

  // Formatear fecha y hora
  const formatearFechaHora = (fechaStr: string | undefined): string => {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return 'Fecha inválida';
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (e) {
        console.error("Error formatting date:", fechaStr, e);
        return 'Error fecha';
    }
  };

  // Obtener color de badge según tipo de mantenimiento
  const getBadgeColor = (tipo: string | undefined): string => {
    switch (tipo?.toLowerCase()) {
      case "preventivo": return "success";
      case "correctivo": return "danger";
      case "predictivo": return "info";
      case "instalación": return "primary";
      case "limpieza": return "warning";
      default: return "secondary";
    }
  };

  // Abrir modal para ver detalles
  const handleShowViewModal = (mantenimiento: Mantenimiento) => {
    setSelectedMantenimiento(mantenimiento);
    setShowViewModal(true);
    setShowAddModal(false);
  };

  return (
    <div>
      {/* Encabezado con Filtro y Botón de Agregar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1>Mantenimientos</h1>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <MantenimientoFilter
            aires={aires}
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

      {/* Alerta de Error */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Card con la Tabla o Mensaje de Carga/Vacío */}
      <Card className="dashboard-card">
        <Card.Body>
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
          {/* Mensaje y botón para cuando no hay datos */}
          {!loading && mantenimientos.length === 0 && (
            <div className="text-center p-5">
              <FiTool size={50} className="text-muted mb-3" />
              <h4>
                No hay registros de mantenimiento{" "}
                {filtroAire
                  ? `para ${
                      aires.find((a) => a.id === filtroAire)?.nombre || ""
                    }`
                  : ""}
              </h4>
              {canEdit && (
                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={handleAdd}
                >
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
        formData={formData}
        fileInputRef={fileInputRef}
        onChange={handleChange}
        onSubmit={handleSubmit}
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
        onShowImagen={(imagenUrl) => {
          if (imagenUrl) {
            const id = parseInt(imagenUrl, 10);
            if (!isNaN(id)) {
              handleShowImagen(id);
            }
          }
        }} // Pasa la función para abrir el modal de imagen desde el modal de vista
        getBadgeColor={getBadgeColor}
        formatearFechaHora={formatearFechaHora}
      />
    </div>
  );
};

export default Mantenimientos;
