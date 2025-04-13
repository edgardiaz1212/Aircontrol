import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback  } from 'react';
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
  //para prueba de conexion bd
  dbStatus: 'checking' | 'connected' | 'disconnected' | 'error'; // Nuevo estado
  checkDbStatus: () => Promise<void>; // Nueva función

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
  //para prueba de conexion bd
  dbStatus: 'checking', // Estado inicial
  checkDbStatus: async () => {} // Función inicial
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
  //para probar conexion bd
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking'); // Estado inicial


  // Cargar usuario si hay token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          setLoading(true);
          const response = await api.get('/auth/user');
          if (response.data) {
            setUser({
              ...response.data,
              id: parseInt(response.data.id)
            });
          }
          setIsAuthenticated(true);
        } catch (error: any) {
          console.error('Error al cargar usuario:', error);
          // Clear invalid token
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          
          // Handle specific error cases
          if (error.response?.status === 401) {
            setError('Sesión expirada, por favor ingresa nuevamente');
          } else if (error.response?.status === 422) {
            setError('Token inválido, por favor ingresa nuevamente');
          } else {
            setError('Error al cargar usuario');
          }
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
        // Ensure we store the raw token without 'Bearer ' prefix
        const token = response.data.access_token.startsWith('Bearer ') 
          ? response.data.access_token.slice(7) 
          : response.data.access_token;
        localStorage.setItem('access_token', token);
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
//Para probar conexionBD
// Función para verificar el estado de la DB
const checkDbStatus = useCallback(async () => {
  // Opcional: poner en 'checking' si quieres feedback visual inmediato al refrescar
  // setDbStatus('checking');
  try {
    const response = await api.get<{ status: string }>('/health/db'); // Llama al nuevo endpoint
    if (response.data.status === 'connected') {
      setDbStatus('connected');
    } else {
      // Tratar 'disconnected' u otros estados del backend como 'disconnected' aquí
      setDbStatus('disconnected');
    }
  } catch (error) {
    // Si la API falla (ej. 503, 500, network error), asumimos desconectado o error
    console.error("Error checking DB status:", error);
    setDbStatus('error'); // O 'disconnected', según prefieras
  }
}, []); // useCallback para evitar re-creaciones innecesarias

// Efecto para verificar el estado periódicamente y al inicio
useEffect(() => {
  checkDbStatus(); // Verificar al cargar la app

  const intervalId = setInterval(() => {
    checkDbStatus();
  }, 30000); // Verificar cada 30 segundos (ajusta según necesidad)

  // Limpiar el intervalo cuando el componente se desmonte
  return () => clearInterval(intervalId);
}, [checkDbStatus]); // Ejecutar cuando checkDbStatus cambie (solo una vez gracias a useCallback)

//fin prueba conexion bd


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
        dbStatus,//para probar conexion bd
    checkDbStatus,//para probar conexion bd
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;