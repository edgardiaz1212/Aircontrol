export interface Mantenimiento {
  id: number;
  aire_id?: number;
  otro_equipo_id?: number;
  fecha: string;
  tipo_mantenimiento: string;
  descripcion?: string;
  tecnico?: string;
  imagen_nombre?: string;
  imagen_tipo?: string;
  imagen_datos?: string;
  creado_por_id: number; // ID of the user who created the maintenance
  creado_por?: {
    nombre: string;
    apellido: string;
  }; // User information
}
