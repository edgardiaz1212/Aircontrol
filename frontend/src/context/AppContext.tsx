import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import api from '../services/api';

// Interfaces
interface User {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

interface AppContextProps {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
}

// Crear contexto inicial
const AppContext = createContext<AppContextProps>({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  clearError: () => {},
});

// Custom hook para acceder al contexto
export const useAppContext = () => useContext(AppContext);

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario si hay token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          setLoading(true);
          const response = await api.get('/auth/user');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          localStorage.removeItem('access_token');
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUser();
  }, []);

  // Función de login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.data.mensaje || 'Error de autenticación');
        return false;
      }
    } catch (error: any) {
      console.error('Error de login:', error);
      setError(error.response?.data?.mensaje || 'Error de conexión con el servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        return true;
      } else {
        setError(response.data.mensaje || 'Error al registrar usuario');
        return false;
      }
    } catch (error: any) {
      console.error('Error de registro:', error);
      setError(error.response?.data?.mensaje || 'Error de conexión con el servidor');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Limpiar error
  const clearError = () => {
    setError(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;