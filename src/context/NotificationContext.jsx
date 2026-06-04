// Academia Flow ERP - Notification Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [lastAction, setLastAction] = useState(null); // { entity, action, record }

  // Fetch/calculate alerts
  const checkSystemAlerts = async () => {
    try {
      const alerts = [];
      const students = await base44.entities.Student.list();
      const attendance = await base44.entities.Attendance.list();
      const schedules = await base44.entities.ExamSchedule.list();

      // Alert 1: Check pending attendance
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => a.date === todayStr);
      if (students.length > 0 && todayAttendance.length === 0) {
        alerts.push({
          id: 'alert_attendance',
          type: 'warning',
          message: 'Daily attendance has not been submitted for today yet.',
          category: 'attendance',
          actionText: 'Mark Now'
        });
      }

      // Alert 2: Check upcoming exam schedules
      const upcomingExams = schedules.filter(s => s.status === 'Scheduled');
      if (upcomingExams.length > 0) {
        alerts.push({
          id: 'alert_exams',
          type: 'info',
          message: `There are ${upcomingExams.length} upcoming examinations scheduled.`,
          category: 'exams',
          actionText: 'View Schedule'
        });
      }

      setNotifications(alerts);
    } catch (err) {
      console.error('Failed to run system audits:', err);
    }
  };

  useEffect(() => {
    checkSystemAlerts();
    // Re-check alerts every 10 seconds
    const interval = setInterval(checkSystemAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Post a toast message
  const triggerToast = (message, type = 'success', action = null) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, action };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Track actions for UNDO capability
  const trackAction = (entity, action, record) => {
    setLastAction({ entity, action, record });
  };

  // Execute undo
  const executeUndo = async () => {
    if (!lastAction) return;

    const { entity, action, record } = lastAction;
    try {
      console.log(`[UNDO] Restoring state for ${entity} (${action})`);
      
      if (action === 'DELETE') {
        // Re-create the deleted item
        await base44.entities[entity].create(record);
        triggerToast(`Restored deleted ${entity.toLowerCase()} record.`, 'success');
      } else if (action === 'UPDATE') {
        // Restore previous record details
        await base44.entities[entity].update(record.id, record);
        triggerToast(`Reverted modifications to ${entity.toLowerCase()}.`, 'success');
      }

      setLastAction(null);
      // Refresh system alerts
      checkSystemAlerts();
    } catch (err) {
      console.error('Undo operation failed:', err);
      triggerToast('Could not complete undo operation: ' + err.message, 'danger');
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      toasts,
      triggerToast,
      removeToast,
      trackAction,
      lastAction,
      executeUndo,
      checkSystemAlerts
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
