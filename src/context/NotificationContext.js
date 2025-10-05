import React, { createContext, useContext, useState } from "react";
import { X } from "lucide-react";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const typeStyles = {
    success: "border-l-green-500 bg-green-50 text-green-700",
    error: "border-l-red-500 bg-red-50 text-red-700",
    warning: "border-l-yellow-500 bg-yellow-50 text-yellow-700",
    info: "border-l-blue-500 bg-blue-50 text-blue-700",
  };

  return (
    <div
      className={`max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 ${
        typeStyles[notification.type] || typeStyles.info
      } transform transition-all duration-300`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => onRemove(notification.id)}
            className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
