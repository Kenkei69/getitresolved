import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { SubmitComplaintPage } from './pages/SubmitComplaintPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManualReviewPage } from './pages/ManualReviewPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { HowScoringWorksPage } from './pages/HowScoringWorksPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Route guard for authenticated users
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'CITIZEN' | 'STAFF' | 'ADMIN'>;
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
        <div className="w-8 h-8 rounded-full border-2 border-civic-600 border-t-transparent animate-spin" />
        <span>Authenticating session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's home dashboard based on role
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff/queue" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/scoring-guide" element={<HowScoringWorksPage />} />

          {/* Citizen Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <SubmitComplaintPage />
              </ProtectedRoute>
            }
          />

          {/* Complaint Details (All roles with backend check) */}
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute>
                <ComplaintDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/queue"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manual-review"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ManualReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminStaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Municipal Civic Service Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16 text-center text-sm text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600 font-medium">
            <span>Getitresolved</span>
            <span>&bull;</span>
            <span>Municipal Citizen Service Portal</span>
            <span>&bull;</span>
            <a href="/scoring-guide" className="hover:text-civic-700 hover:underline">
              Scoring Methodology
            </a>
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            Transparent municipal issue resolution featuring automated triage, deterministic department routing, and multi-factor impact prioritization.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
