
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('isAdminAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      // Fallback or specific handling if localStorage is not available
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((password: string): boolean => {
    if (!ADMIN_PASSWORD) {
      console.warn("Advertencia: NEXT_PUBLIC_ADMIN_PASSWORD no está configurada en el archivo .env. El inicio de sesión fallará.");
      return false;
    }
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('isAdminAuthenticated', 'true');
      } catch (error) {
         console.error("Error setting localStorage:", error);
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('isAdminAuthenticated');
    } catch (error) {
      console.error("Error removing localStorage item:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
