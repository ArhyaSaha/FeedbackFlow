import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './pages/LoginForm';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/*"
          element={
            user.role === 'manager' ?
              <Navigate to="/manager" replace /> :
              <Navigate to="/employee" replace />
          }
        />
        <Route
          path="/manager/*"
          element={
            user.role === 'manager' ?
              <ManagerDashboard /> :
              <Navigate to="/employee" replace />
          }
        />
        <Route
          path="/employee/*"
          element={
            user.role === 'employee' ?
              <EmployeeDashboard /> :
              <Navigate to="/manager" replace />
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>

        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;