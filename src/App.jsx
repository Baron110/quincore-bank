import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage        from "./pages/LoginPage";
import SignupPage       from "./pages/SignupPage";
import DashboardPage    from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import VirtualCardPage  from "./pages/VirtualCardPage";
import AnalyticsPage    from "./pages/AnalyticsPage";
import ProfilePage      from "./pages/ProfilePage";
import ReceiptPage      from "./pages/ReceiptPage";
import AdminPage        from "./pages/AdminPage";
import LoanPage         from "./pages/LoanPage";
import VerificationPage from "./pages/VerificationPage";
import ChequePage       from "./pages/ChequePage";
import CryptoPage       from "./pages/CryptoPage";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"              element={<Navigate to="/login" replace />} />
        <Route path="/login"         element={<Public><LoginPage /></Public>} />
        <Route path="/signup"        element={<Public><SignupPage /></Public>} />
        <Route path="/dashboard"     element={<Protected><DashboardPage /></Protected>} />
        <Route path="/transactions"  element={<Protected><TransactionsPage /></Protected>} />
        <Route path="/card"          element={<Protected><VirtualCardPage /></Protected>} />
        <Route path="/analytics"     element={<Protected><AnalyticsPage /></Protected>} />
        <Route path="/profile"       element={<Protected><ProfilePage /></Protected>} />
        <Route path="/receipt"       element={<Protected><ReceiptPage /></Protected>} />
        <Route path="/loan"          element={<Protected><LoanPage /></Protected>} />
        <Route path="/verify"        element={<Protected><VerificationPage /></Protected>} />
        <Route path="/cheque"        element={<Protected><ChequePage /></Protected>} />
        <Route path="/crypto"        element={<Protected><CryptoPage /></Protected>} />
        <Route path="/admin"         element={<AdminPage />} />
        <Route path="*"              element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}