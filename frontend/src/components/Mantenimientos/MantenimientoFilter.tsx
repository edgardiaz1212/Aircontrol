// src/components/Mantenimientos/MantenimientoFilter.tsx
import React from "react";
import { Dropdown } from "react-bootstrap";
import { FiFilter } from "react-icons/fi";
import { AireAcondicionadoOption } from '../../pages/Mantenimientos';


interface MantenimientoFilterProps {
  aires: AireAcondicionadoOption[]; // La prop que podría no ser un array
  filtroAire: number | null;
  onFilterChange: (aireId: number | null) => void;
}

const MantenimientoFilter: React.FC<MantenimientoFilterProps> = ({
  aires, // Recibe la prop
  filtroAire,
  onFilterChange,
}) => {
  // --- DEFENSA: Verificar si 'aires' es un array ---
  const isValidAiresArray = Array.isArray(aires);

  // Ejecutar .find() solo si es un array válido
  const aireFiltrado = isValidAiresArray
    ? aires.find((a) => a.id === filtroAire)
    : undefined; // Si no es array, no hay aire filtrado

  return (
    <Dropdown className="d-inline-block">
      <Dropdown.Toggle
        variant="outline-secondary"
        id="dropdown-filtro-mantenimiento"
      >
        <FiFilter className="me-2" />
        {aireFiltrado
          ? `Filtro: ${aireFiltrado.nombre}`
          : "Todos los equipos"} {/* Cambiado para ser más genérico */}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => onFilterChange(null)}>
          Todos los equipos
        </Dropdown.Item>
        <Dropdown.Divider />
        {/* Renderizar items solo si 'aires' es un array válido */}
        {isValidAiresArray ? (
          aires.map((aire) => (
            <Dropdown.Item
              key={aire.id}
              onClick={() => onFilterChange(aire.id)}
              active={filtroAire === aire.id}
            >
              {aire.nombre} - {aire.ubicacion}
            </Dropdown.Item>
          ))
        ) : (
          // Opcional: Mostrar un estado mientras carga o si hay error
          <Dropdown.Item disabled>Cargando filtros...</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default MantenimientoFilter;
