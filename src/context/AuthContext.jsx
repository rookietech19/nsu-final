// Academia Flow ERP - Authentication Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAuthUser, createAuthUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('acadflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Basic session validation could go here
    setIsLoading(false);
  }, []);

  const updateSession = (userData, role) => {
    const mappedUser = {
      ...userData,
      role: role || 'student'
    };
    setUser(mappedUser);
    setIsAuthenticated(true);
    localStorage.setItem('acadflow_user', JSON.stringify(mappedUser));
  };

  const clearSession = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('acadflow_user');
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const sessionUser = loginAuthUser(email, password);
      updateSession(sessionUser, sessionUser.role);
      return sessionUser;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const newUser = createAuthUser({ name, email, password, role: 'student', approved: false });
      return newUser;
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      clearSession();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Roles Definition
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isLeader = user?.role === 'leader';
  const isStudent = user?.role === 'student';
  
  // Legacy aliases
  const isUser = isStudent;
  const hasWriteAccess = isAdmin || isTeacher;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      isSuperAdmin,
      isAdmin,
      isTeacher,
      isLeader,
      isStudent,
      isUser, // Legacy alias
      hasWriteAccess // Legacy alias
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
