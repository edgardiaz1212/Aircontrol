import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FiFilter } from 'react-icons/fi';

// Reutilizamos la interfaz definida en Lecturas.tsx (o la movemos a un archivo types.ts)
interface AireAcondicionado {
  id: number;
  nombre: string;
  ubicacion: string;
}

interface LecturasFilterProps {
  aires: AireAcondicionado[];
  filtroAire: number | null;
  onFilterChange: (aireId: number | null) => void;
}

const LecturasFilter: React.FC<LecturasFilterProps> = ({
  aires,
  filtroAire,
  onFilterChange
}) => {
  const aireSeleccionado = aires.find(a => a.id === filtroAire);
  const nombreFiltro = aireSeleccionado ? `${aireSeleccionado.nombre} (${aireSeleccionado.ubicacion})` : 'Todos los aires';

  return (
    <Dropdown className="d-inline-block me-2">
      <Dropdown.Toggle variant="outline-secondary" id="dropdown-filtro">
        <FiFilter className="me-2" />
        {nombreFiltro}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => onFilterChange(null)}>
          Todos los aires
        </Dropdown.Item>
        <Dropdown.Divider />
        {aires.map(aire => (
          <Dropdown.Item
            key={aire.id}
            onClick={() => onFilterChange(aire.id)}
            active={filtroAire === aire.id} // Marcar como activo si está seleccionado
          >
            {aire.nombre} - {aire.ubicacion}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LecturasFilter;
