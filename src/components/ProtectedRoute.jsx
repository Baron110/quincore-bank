import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const user = useAuth();
  if (user === undefined) {
    // Still loading auth state — show nothing
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="font-label-md text-on-surface-variant mt-4">Loading your account…</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}
