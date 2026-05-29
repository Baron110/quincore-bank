import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LoginPage      from "./pages/LoginPage";
import SignupPage     from "./pages/SignupPage";
import DashboardPage  from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import VirtualCardPage  from "./pages/VirtualCardPage";
import AnalyticsPage    from "./pages/AnalyticsPage";
import ProfilePage      from "./pages/ProfilePage";
import ReceiptPage      from "./pages/ReceiptPage";

// Protected: redirects to /login if not authenticated
function Protected({ children }) {
  const user = useAuth();
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 48 }}>sync</span>
          <p className="font-label-md text-on-surface-variant mt-4">Loading…</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

// Public: redirects to /dashboard if already logged in
function Public({ children }) {
  const user = useAuth();
  if (user === undefined) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Navigate to="/login" replace />} />
        <Route path="/login"        element={<Public><LoginPage /></Public>} />
        <Route path="/signup"       element={<Public><SignupPage /></Public>} />
        <Route path="/dashboard"    element={<Protected><DashboardPage /></Protected>} />
        <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
        <Route path="/virtual-card" element={<Protected><VirtualCardPage /></Protected>} />
        <Route path="/analytics"    element={<Protected><AnalyticsPage /></Protected>} />
        <Route path="/profile"      element={<Protected><ProfilePage /></Protected>} />
        <Route path="/receipt"      element={<Protected><ReceiptPage /></Protected>} />
        <Route path="*"             element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
