/**
 * Global banner notification context.
 * Use useNotification() for success/error/warning/info feedback.
 *
 * Integration points (replace alert() or inline status):
 * - AdminNotifications.jsx: replace inline statusMessage with success()/error()
 * - PerformancePage.jsx: optionally show exam banner via info()/warning()
 * - Settings page: "Preferences saved" on successful save
 * - Library (upload/delete/move): replace alert() with success()/error()
 * - Generate modals (Summary, MCQ, Flashcards): add success/error banners
 */
import React, { createContext, useContext, useCallback, useRef } from "react";

const DEFAULT_DURATIONS = {
  success: 5000,
  error: 0,
  warning: 5000,
  info: 5000,
};

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = React.useState([]);
  const timersRef = useRef({});

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addNotification = useCallback((type, message, duration) => {
    const id = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const resolvedDuration =
      duration !== undefined && duration !== null
        ? duration
        : DEFAULT_DURATIONS[type] ?? 5000;

    const notification = { id, type, message, duration: resolvedDuration };
    setNotifications((prev) => [...prev, notification]);

    if (resolvedDuration > 0) {
      timersRef.current[id] = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        delete timersRef.current[id];
      }, resolvedDuration);
    }

    return id;
  }, []);

  const success = useCallback(
    (message, duration) => addNotification("success", message, duration),
    [addNotification]
  );
  const error = useCallback(
    (message, duration) => addNotification("error", message, duration),
    [addNotification]
  );
  const warning = useCallback(
    (message, duration) => addNotification("warning", message, duration),
    [addNotification]
  );
  const info = useCallback(
    (message, duration) => addNotification("info", message, duration),
    [addNotification]
  );

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
}
