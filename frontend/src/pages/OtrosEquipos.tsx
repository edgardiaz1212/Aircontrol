// src/pages/OtrosEquipos.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Box, Typography, Alert, CircularProgress, Stack } from '@mui/material';
// import { AddCircleOutline as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'; // <-- REMOVE THIS LINE
import { FiPlusCircle, FiEdit, FiTrash2 } from 'react-icons/fi'; // <-- ADD THIS LINE
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { toast } from 'react-toastify';

import api from '../services/api'; // Tu instancia de Axios configurada
import EquipoForm from '../components/forms/EquipoForm';

// --- INICIO: Definición de la interfaz OtroEquipo ---
interface OtroEquipo {
  id: number;
  nombre: string;
  tipo: 'Motogenerador' | 'UPS' | 'PDU' | 'Otro'; // Tipos permitidos
  ubicacion?: string | null;
  marca?: string | null;
  modelo?: string | null;
  serial?: string | null;
  codigo_inventario?: string | null;
  fecha_instalacion?: string | null; // Formato YYYY-MM-DD del backend
  estado_operativo: boolean;
  notas?: string | null;
  fecha_creacion?: string; // Opcional si lo necesitas mostrar (Formato YYYY-MM-DD HH:MM:SS)
  ultima_modificacion?: string; // Opcional (Formato YYYY-MM-DD HH:MM:SS)
}
// --- FIN: Definición de la interfaz OtroEquipo ---

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto' as 'auto',
};

const OtrosEquipos: React.FC = () => {
  const [equiposList, setEquiposList] = useState<OtroEquipo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<number | null>(null);
  // Usa la interfaz definida localmente
  const [formData, setFormData] = useState<Partial<OtroEquipo>>({
    nombre: '',
    tipo: 'Otro', // Valor inicial por defecto
    ubicacion: '',
    marca: '',
    modelo: '',
    serial: '',
    codigo_inventario: '',
    fecha_instalacion: null, // Usa null para fechas opcionales
    estado_operativo: true,
    notas: '',
  });

  const fetchEquiposList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Usa la interfaz definida localmente para el tipo de respuesta
      const response = await api.get<OtroEquipo[]>('/otros-equipos');
      setEquiposList(response.data || []); // Asegura que sea un array
    } catch (err: any) {
      console.error("Error fetching equipos:", err);
      const errorMsg = err.response?.data?.mensaje || err.message || 'Error al cargar los equipos';
      setError(errorMsg);
      toast.error(`Error al cargar equipos: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquiposList();
  }, [fetchEquiposList]);

  // Usa la interfaz definida localmente para el parámetro 'equipo'
  const handleOpenModal = (mode: 'add' | 'edit', equipo?: OtroEquipo) => {
    setFormMode(mode);
    if (mode === 'edit' && equipo) {
      setEditingId(equipo.id);
      const fechaFormato = equipo.fecha_instalacion ? equipo.fecha_instalacion.split('T')[0] : null;
      setFormData({ ...equipo, fecha_instalacion: fechaFormato });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        tipo: 'Otro',
        ubicacion: '',
        marca: '',
        modelo: '',
        serial: '',
        codigo_inventario: '',
        fecha_instalacion: null,
        estado_operativo: true,
        notas: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;

    if (type === 'checkbox' && event.target instanceof HTMLInputElement) {
        // Usa la interfaz definida localmente para el tipo de prev
        setFormData((prev: Partial<OtroEquipo>) => ({ ...prev, [name]: (event.target as HTMLInputElement).checked }));
    } else {
        // Usa la interfaz definida localmente para el tipo de prev
        setFormData((prev: Partial<OtroEquipo>) => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!formData.nombre || !formData.tipo) {
        toast.error('Nombre y Tipo son campos requeridos.');
        setIsLoading(false);
        return;
    }

    const payload = {
        ...formData,
        fecha_instalacion: formData.fecha_instalacion || null,
    };

    try {
      let response;
      // Usa la interfaz definida localmente para el tipo esperado
      let updatedEquipo: OtroEquipo | null = null;

      if (formMode === 'add') {
        // Usa la interfaz definida localmente para el tipo esperado en 'data'
        response = await api.post<{ success: boolean; mensaje: string; data: OtroEquipo }>('/otros-equipos', payload);
        updatedEquipo = response.data?.data;
        if (updatedEquipo && updatedEquipo.id) {
          if (updatedEquipo) {
            setEquiposList(prevList => [...prevList, updatedEquipo]);
          }
          toast.success(response.data.mensaje || 'Equipo agregado exitosamente');
        } else {
           console.warn("No se recibió el nuevo equipo creado desde el backend o faltó el ID. Refrescando lista...");
           toast.warn("Equipo agregado, refrescando lista...");
           fetchEquiposList();
        }
      } else if (formMode === 'edit' && editingId) {
        // Usa la interfaz definida localmente para el tipo esperado en 'data'
        response = await api.put<{ success: boolean; mensaje: string; data: OtroEquipo }>(`/otros-equipos/${editingId}`, payload);
        updatedEquipo = response.data?.data;
         if (updatedEquipo && updatedEquipo.id) {
            setEquiposList(prevList =>
              // Usa la interfaz definida localmente para el tipo 'eq'
              prevList.map(eq => (eq.id === editingId ? updatedEquipo! : eq))
            );
            toast.success(response.data.mensaje || 'Equipo actualizado exitosamente');
         } else {
             console.warn("No se recibió el equipo actualizado desde el backend o faltó el ID. Refrescando lista...");
             toast.warn("Equipo actualizado, refrescando lista...");
             fetchEquiposList();
         }
      }

      handleCloseModal();

    } catch (err: any) {
      console.error(`Error ${formMode === 'add' ? 'adding' : 'updating'} equipo:`, err);
      const errorMsg = err.response?.data?.mensaje || err.message || `Error al ${formMode === 'add' ? 'agregar' : 'actualizar'} el equipo`;
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) {
      setIsLoading(true);
      try {
        await api.delete(`/otros-equipos/${id}`);
        // Usa la interfaz definida localmente para el tipo 'eq'
        setEquiposList(prevList => prevList.filter(eq => eq.id !== id));
        toast.success('Equipo eliminado exitosamente');
      } catch (err: any) {
        console.error("Error deleting equipo:", err);
        const errorMsg = err.response?.data?.mensaje || err.message || 'Error al eliminar el equipo';
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Usa la interfaz definida localmente para GridRowParams
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nombre', headerName: 'Nombre', width: 200, flex: 1 },
    { field: 'tipo', headerName: 'Tipo', width: 130 },
    { field: 'ubicacion', headerName: 'Ubicación', width: 180, flex: 1 },
    { field: 'marca', headerName: 'Marca', width: 120 },
    { field: 'modelo', headerName: 'Modelo', width: 120 },
    { field: 'serial', headerName: 'Serial', width: 150 },
    { field: 'estado_operativo', headerName: 'Operativo', width: 100, type: 'boolean' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 100,
      cellClassName: 'actions',
      // Usa la interfaz definida localmente para GridRowParams
      getActions: (params: GridRowParams<OtroEquipo>) => [
        <GridActionsCellItem
          icon={<FiEdit />} // <-- CHANGE ICON
          label="Editar"
          onClick={() => handleOpenModal('edit', params.row)}
          color="inherit"
        />,
        <GridActionsCellItem
          icon={<FiTrash2 />} // <-- CHANGE ICON
          label="Eliminar"
          onClick={() => handleDelete(params.row.id)}
          color="inherit"
        />,
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Gestión de Otros Equipos
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlusCircle />} // <-- CHANGE ICON
          onClick={() => handleOpenModal('add')}
        >
          Agregar Equipo
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading && !equiposList.length ? (
         <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
         </Box>
      ) : (
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={equiposList}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            loading={isLoading}
            checkboxSelection={false}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      <Modal
        open={showModal}
        onClose={handleCloseModal}
        aria-labelledby="equipo-modal-title"
        aria-describedby="equipo-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="equipo-modal-title" variant="h6" component="h2" mb={2}>
            {formMode === 'add' ? 'Agregar Nuevo Equipo' : 'Editar Equipo'}
          </Typography>
          <EquipoForm
             formData={formData}
             handleInputChange={handleInputChange}
             handleSubmit={handleSubmit}
             handleCloseModal={handleCloseModal}
             formMode={formMode}
             isLoading={isLoading}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default OtrosEquipos;
