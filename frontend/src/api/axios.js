import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/', // Relies on Vite proxy in dev if env not set
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Backend expects this format? 
      // Checking backend middleware: imported { verifyToken } from "../middleware/verifyToken.js";
      // Assuming verifyToken checks Authorization header. Usually Bearer schema.
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
