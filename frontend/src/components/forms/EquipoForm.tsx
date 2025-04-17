// src/components/forms/EquipoForm.tsx
import React from 'react';
import { Box, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, CircularProgress, Stack } from '@mui/material';
// import { OtroEquipo } from '../../types'; // <-- ELIMINA ESTA LÍNEA

// --- INICIO: Definición de la interfaz OtroEquipo ---
// Puedes copiar la misma definición de OtrosEquipos.tsx
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
  // No necesitamos fecha_creacion/ultima_modificacion en el formulario generalmente
}
// --- FIN: Definición de la interfaz OtroEquipo ---


interface EquipoFormProps {
  // Usa la interfaz definida localmente
  formData: Partial<OtroEquipo>;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleCloseModal: () => void;
  formMode: 'add' | 'edit';
  isLoading?: boolean;
}

const EquipoForm: React.FC<EquipoFormProps> = ({
  formData,
  handleInputChange,
  handleSubmit,
  handleCloseModal,
  formMode,
  isLoading = false,
}) => {

  // Usa la interfaz definida localmente para el tipo
  const tiposPermitidos: OtroEquipo['tipo'][] = ['Motogenerador', 'UPS', 'PDU', 'Otro'];

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        {/* ... resto de los campos del formulario sin cambios ... */}
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="nombre"
            label="Nombre del Equipo"
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleInputChange}
            autoFocus={formMode === 'add'}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              id="tipo"
              name="tipo"
              value={formData.tipo || 'Otro'}
              label="Tipo"
              onChange={handleInputChange}
            >
              {tiposPermitidos.map((tipoOption) => (
                <MenuItem key={tipoOption} value={tipoOption}>
                  {tipoOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="ubicacion"
            label="Ubicación"
            name="ubicacion"
            value={formData.ubicacion || ''}
            onChange={handleInputChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="marca"
            label="Marca"
            name="marca"
            value={formData.marca || ''}
            onChange={handleInputChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="modelo"
            label="Modelo"
            name="modelo"
            value={formData.modelo || ''}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="serial"
            label="Serial"
            name="serial"
            value={formData.serial || ''}
            onChange={handleInputChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="codigo_inventario"
            label="Código Inventario"
            name="codigo_inventario"
            value={formData.codigo_inventario || ''}
            onChange={handleInputChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="fecha_instalacion"
            label="Fecha Instalación"
            name="fecha_instalacion"
            type="date"
            value={formData.fecha_instalacion || ''}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
         <Grid item xs={12}>
            <FormControlLabel
                control={
                <Checkbox
                    checked={formData.estado_operativo ?? true}
                    onChange={handleInputChange}
                    name="estado_operativo"
                    color="primary"
                />
                }
                label="Equipo Operativo"
            />
         </Grid>
         <Grid item xs={12}>
          <TextField
            fullWidth
            id="notas"
            label="Notas Adicionales"
            name="notas"
            multiline
            rows={3}
            value={formData.notas || ''}
            onChange={handleInputChange}
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={handleCloseModal} color="secondary" disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Guardando...' : (formMode === 'add' ? 'Agregar Equipo' : 'Guardar Cambios')}
        </Button>
      </Stack>
    </Box>
  );
};

export default EquipoForm;
