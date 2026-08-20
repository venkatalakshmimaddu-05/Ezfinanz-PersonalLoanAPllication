import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Verify from "./pages/Verify";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ApplicationWizard from "./pages/customer/ApplicationWizard";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApplicationDetail from "./pages/admin/AdminApplicationDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-ink-50">
          <Navbar />

          <Routes>
            {/* ================= PUBLIC ROUTES ================= */}

            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />

            <Route path="/signup" element={<Signup />} />

            <Route path="/verify" element={<Verify />} />

            {/* ================= CUSTOMER ROUTES ================= */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  requireRole="CUSTOMER"
                  requireVerified
                >
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/application/:id"
              element={
                <ProtectedRoute
                  requireRole="CUSTOMER"
                  requireVerified
                >
                  <ApplicationWizard />
                </ProtectedRoute>
              }
            />

            {/* ================= ADMIN ROUTES ================= */}

            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/applications/:id"
              element={
                <ProtectedRoute requireRole="ADMIN">
                  <AdminApplicationDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}