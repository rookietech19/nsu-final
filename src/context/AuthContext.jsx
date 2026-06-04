// Academia Flow ERP - Authentication Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all registered users
  const fetchUsers = async () => {
    try {
      const list = await base44.entities.User.list();
      setAllUsers(list);
    } catch (err) {
      console.error('Failed to load registered users:', err);
    }
  };

  // Check login state on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          await fetchUsers();
        }
      } catch (err) {
        console.error('Session validation failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Login handler
  const login = async (roleOverride = 'admin') => {
    setIsLoading(true);
    try {
      // Setup mock data based on selected role
      let email = 'dr.sarah.smith@acadflow.edu';
      let name = 'Dr. Sarah Smith';
      
      if (roleOverride === 'teacher') {
        email = 'prof.arthur@acadflow.edu';
        name = 'Prof. Arthur Pendelton';
      } else if (roleOverride === 'user') {
        email = 'anya.chen@student.aegis-med.edu';
        name = 'Anya Chen';
      }

      // Perform auth call
      const loggedUser = await base44.auth.loginViaProvider('google');
      
      // Update session values
      const updatedUser = {
        ...loggedUser,
        email,
        name,
        role: roleOverride
      };
      
      localStorage.setItem('acadflow_current_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsAuthenticated(true);
      
      // Ensure user list has this user with correct role
      const users = await base44.entities.User.list();
      const existingIdx = users.findIndex(u => u.email === email);
      if (existingIdx !== -1) {
        if (users[existingIdx].role !== roleOverride) {
          users[existingIdx].role = roleOverride;
          await base44.entities.User.update(users[existingIdx].id, { role: roleOverride });
        }
      } else {
        await base44.entities.User.create({
          email,
          name,
          role: roleOverride,
          createdAt: new Date().toISOString()
        });
      }

      await fetchUsers();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      await base44.auth.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Promote user role (Admin action)
  const promoteUser = async (userId, newRole) => {
    try {
      const updated = await base44.entities.User.update(userId, { role: newRole });
      
      // If promoting the currently logged in user, refresh their session
      if (user && user.email === updated.email) {
        const refreshedUser = { ...user, role: newRole };
        localStorage.setItem('acadflow_current_user', JSON.stringify(refreshedUser));
        setUser(refreshedUser);
      }
      
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Promotion failed:', err);
      throw err;
    }
  };

  // Helpers
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isUser = user?.role === 'user';
  const hasWriteAccess = isAdmin || isTeacher;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      allUsers,
      login,
      logout,
      promoteUser,
      isAdmin,
      isTeacher,
      isUser,
      hasWriteAccess,
      refreshUsers: fetchUsers
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
