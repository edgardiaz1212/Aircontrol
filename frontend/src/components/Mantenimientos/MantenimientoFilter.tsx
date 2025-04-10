import React from "react";
import { Dropdown } from "react-bootstrap";
import { FiFilter } from "react-icons/fi";

// Interfaz simplificada para las opciones del filtro
interface AireAcondicionadoOption {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface MantenimientoFilterProps {
  aires: AireAcondicionadoOption[];
  filtroAire: number | null;
  onFilterChange: (aireId: number | null) => void;
}

const MantenimientoFilter: React.FC<MantenimientoFilterProps> = ({
  aires,
  filtroAire,
  onFilterChange,
}) => {
  const aireFiltrado = aires.find((a) => a.id === filtroAire);

  return (
    <Dropdown className="d-inline-block">
      <Dropdown.Toggle
        variant="outline-secondary"
        id="dropdown-filtro-mantenimiento"
      >
        <FiFilter className="me-2" />
        {aireFiltrado
          ? `Filtro: ${aireFiltrado.nombre}`
          : "Todos los aires"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => onFilterChange(null)}>
          Todos los aires
        </Dropdown.Item>
        <Dropdown.Divider />
        {aires.map((aire) => (
          <Dropdown.Item
            key={aire.id}
            onClick={() => onFilterChange(aire.id)}
            active={filtroAire === aire.id}
          >
            {aire.nombre} - {aire.ubicacion}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default MantenimientoFilter;
