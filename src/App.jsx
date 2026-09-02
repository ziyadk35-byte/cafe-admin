import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Products from './pages/Products';
import Staff from './pages/Staff';
import Coupons from './pages/Coupons';
import Reports from './pages/Reports';
import Orders from './pages/Orders';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">{children}</div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/branches"
        element={
          <ProtectedLayout>
            <Branches />
          </ProtectedLayout>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedLayout>
            <Products />
          </ProtectedLayout>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedLayout>
            <Staff />
          </ProtectedLayout>
        }
      />
      <Route
        path="/coupons"
        element={
          <ProtectedLayout>
            <Coupons />
          </ProtectedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedLayout>
            <Orders />
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
