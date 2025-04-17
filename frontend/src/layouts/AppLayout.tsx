import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar, Button, Dropdown } from 'react-bootstrap';
import { useAppContext } from '../context/AppContext';
import { FiMenu, FiUser, FiLogOut, FiSettings, FiHome, FiWind, FiList, FiBarChart2, FiTool, FiAlertCircle, FiUsers, FiZap } from 'react-icons/fi';
import madDataIcon from '../img/mad_data.png';
import logo from '../img/CDHLogo.png' 
import "../styles/app.css"

const AppLayout: React.FC = () => {
  const { user, logout } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determinar si se debe mostrar el footer
  const showFooter = location.pathname !== '/login';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="d-flex justify-content-between align-items-center p-3">
          {!sidebarCollapsed && <h5 className="m-0">Monitoreo AC</h5>}
          <Button variant="link" className="text-light p-0" onClick={toggleSidebar}>
            <FiMenu size={24} />
          </Button>
        </div>

        <Nav className="flex-column mt-3">
          <Nav.Link onClick={() => navigate('/dashboard')} className="text-light">
            <div className="d-flex align-items-center">
              <FiHome size={20} />
              {!sidebarCollapsed && <span className="ms-3">Dashboard</span>}
            </div>
          </Nav.Link>

          <Nav.Link onClick={() => navigate('/aires')} className="text-light">
            <div className="d-flex align-items-center">
              <FiWind size={20} />
              {!sidebarCollapsed && <span className="ms-3">Aires</span>}
            </div>
          </Nav.Link>

          <Nav.Link onClick={() => navigate('/lecturas')} className="text-light">
            <div className="d-flex align-items-center">
              <FiList size={20} />
              {!sidebarCollapsed && <span className="ms-3">Lecturas</span>}
            </div>
          </Nav.Link>

          <Nav.Link onClick={() => navigate('/estadisticas')} className="text-light">
            <div className="d-flex align-items-center">
              <FiBarChart2 size={20} />
              {!sidebarCollapsed && <span className="ms-3">Estadísticas</span>}
            </div>
          </Nav.Link>
          <Nav.Link onClick={() => navigate('/otros-equipos')} className="text-light">
            <div className="d-flex align-items-center">
            <FiZap  size={20} />
              {!sidebarCollapsed && <span className="ms-3">Otros equipos</span>}
            </div>
          </Nav.Link>


          <Nav.Link onClick={() => navigate('/mantenimientos')} className="text-light">
            <div className="d-flex align-items-center">
              <FiTool size={20} />
              {!sidebarCollapsed && <span className="ms-3">Mantenimientos</span>}
            </div>
          </Nav.Link>

          <Nav.Link onClick={() => navigate('/umbrales')} className="text-light">
            <div className="d-flex align-items-center">
              <FiAlertCircle size={20} />
              {!sidebarCollapsed && <span className="ms-3">Umbrales</span>}
            </div>
          </Nav.Link>

          {user?.rol === 'admin' && (
            <Nav.Link onClick={() => navigate('/usuarios')} className="text-light">
              <div className="d-flex align-items-center">
                <FiUsers size={20} />
                {!sidebarCollapsed && <span className="ms-3">Usuarios</span>}
              </div>
            </Nav.Link>
          )}
        </Nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navbar */}
        <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
          <Container fluid>
          <img className="navLogo me-2" src={logo}></img>
            <Navbar.Brand>Sistema de Monitoreo AC DCCE</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" id="dropdown-user">
                  <FiUser className="me-2" /> {user?.nombre} {user?.apellido} ({user?.rol})
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => navigate('/perfil')}>
                    <FiSettings className="me-2" /> Perfil
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FiLogOut className="me-2" /> Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Page Content */}
        <Container fluid>
          <Outlet />
        </Container>
        {/* Footer */}
        {showFooter && (
          <footer className="app-footer">
            <div className="d-flex align-items-center justify-content-center">
              <img src={madDataIcon} alt="MAD Data" height="80" className="me-2" />
              <span className="text-muted">© {new Date().getFullYear()}</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
