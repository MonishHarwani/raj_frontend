import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppRoutes from "./components/AppRoutes";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <div className="App">
                <AppRoutes />
              </div>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
