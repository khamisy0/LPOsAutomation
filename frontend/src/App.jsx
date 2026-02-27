import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoiceUploadPage } from './pages/InvoiceUploadPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoicePreviewPage } from './pages/InvoicePreviewPage';
import { TrackerPage } from './pages/TrackerPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/upload"
          element={
            <ProtectedRoute>
              <InvoiceUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:invoiceId"
          element={
            <ProtectedRoute>
              <InvoicePreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:invoiceId/preview"
          element={
            <ProtectedRoute>
              <InvoicePreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <ProtectedRoute>
              <TrackerPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
