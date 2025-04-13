// frontend/src/components/DbStatusIndicator.tsx
import React from 'react';
import { Badge } from 'react-bootstrap';
import { FiDatabase, FiCheckCircle, FiXCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';

const DbStatusIndicator: React.FC = () => {
  const { dbStatus } = useAppContext();

  let variant: string;
  let icon: JSX.Element;
  let text: string;

  switch (dbStatus) {
    case 'connected':
      variant = 'success';
      icon = <FiCheckCircle className="me-1" />;
      text = 'DB Conectada';
      break;
    case 'disconnected':
      variant = 'danger';
      icon = <FiXCircle className="me-1" />;
      text = 'DB Desconectada';
      break;
    case 'error':
      variant = 'warning';
      icon = <FiAlertTriangle className="me-1" />;
      text = 'Error DB';
      break;
    case 'checking':
    default:
      variant = 'secondary';
      icon = <FiLoader className="me-1 spinner-grow spinner-grow-sm" />; // O un spinner
      text = 'Verificando DB...';
      break;
  }

  return (
    <Badge pill bg={variant} className="d-flex align-items-center px-2 py-1">
      <FiDatabase className="me-1" />
      {icon}
      <span style={{ fontSize: '0.8em' }}>{text}</span>
    </Badge>
  );
};

export default DbStatusIndicator;
