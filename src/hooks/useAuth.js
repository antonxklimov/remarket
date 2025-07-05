import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '/api';

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Функция для входа
  const login = useCallback(async (password) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with password:', password);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      console.log('Login response status:', response.status);
      
      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка аутентификации');
      }

      // Сохраняем токен
      console.log('Saving token to localStorage:', data.token);
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Функция для выхода
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Функция для получения заголовков с токеном
  const getAuthHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }, [token]);

  // Проверяем токен при загрузке
  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [token]);

  return {
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    getAuthHeaders,
  };
} 