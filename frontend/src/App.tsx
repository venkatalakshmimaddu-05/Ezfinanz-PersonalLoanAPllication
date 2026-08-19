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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireRole="CUSTOMER">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/application/:id"
              element={
                <ProtectedRoute requireRole="CUSTOMER">
                  <ApplicationWizard />
                </ProtectedRoute>
              }
            />

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
