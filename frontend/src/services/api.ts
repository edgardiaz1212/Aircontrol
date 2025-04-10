import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_URL  || '/api'
console.log(baseURL)

// Crear una instancia de axios con configuración común
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT en cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Ensure token doesn't already have 'Bearer ' prefix
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      //console.log('Sending token:', cleanToken); // Debug log
      config.headers.Authorization = `Bearer ${cleanToken}`;
      //console.log('Authorization header:', config.headers.Authorization); // Debug log
    }
    return config;
  },
  (error) => {
    console.error('Error en interceptor de solicitud Axios:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si es error de autenticación, redirigir al login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;