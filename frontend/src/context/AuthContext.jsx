import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
          try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));

              const decoded = JSON.parse(jsonPayload);
              setUser(decoded); // { userEmail: ... }
              setIsAuthenticated(true);
              await checkAdminStatus(token);
          } catch (e) {
              console.error("Invalid token", e);
              localStorage.removeItem('token');
          }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const checkAdminStatus = async (token) => {
    try {
      const response = await api.post("/form/isAdmin", {});
      console.log("Admin Check Response:", response.data);
      setIsAdmin(response.data.isAdmin);
    } catch (error) {
       console.error("Failed to check admin status", error);
       setIsAdmin(false);
    }
  };

  const login = (token) => {
    localStorage.setItem('token', token);
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const decoded = JSON.parse(jsonPayload);
        setUser(decoded);
        setIsAuthenticated(true);
        checkAdminStatus(token);
    } catch (e) {
        console.error("Error decoding token during login", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
