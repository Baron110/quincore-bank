import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setResetMsg(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setError(msgs[err.code] || "Sign-in failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) { setError("Enter your email above first."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Reset link sent! Check your inbox.");
      setError("");
    } catch { setError("Could not send reset email."); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-gutter bg-background">
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-xl">
        {/* Logo */}
        <div className="text-center mb-lg">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>account_balance</span>
          <h1 className="font-hanken text-headline-md text-primary mt-2">QuinCore Bank</h1>
          <p className="font-label-md text-on-surface-variant mt-xs">Premium Digital Banking</p>
        </div>

        <h2 className="font-hanken text-headline-lg text-primary mb-md">Welcome back</h2>

        {error   && <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg font-label-md text-label-md">{error}</div>}
        {resetMsg && <div className="mb-md p-sm bg-green-100 text-green-700 rounded-lg font-label-md text-label-md">{resetMsg}</div>}

        <form className="space-y-md" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="font-label-md text-label-md text-primary block mb-xs">Email</label>
            <input
              className="w-full px-md py-sm rounded-lg border border-outline-variant font-body-sm focus:outline-none focus:border-primary transition-colors"
              type="email" placeholder="name@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-primary block mb-xs">Password</label>
            <div className="relative">
              <input
                className="w-full px-md py-sm rounded-lg border border-outline-variant font-body-sm focus:outline-none focus:border-primary transition-colors pr-12"
                type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div className="text-right">
            <button type="button" onClick={handleReset}
              className="font-label-sm text-label-sm text-primary hover:underline">
              Forgot password?
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-sm"
          >
            {loading
              ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Signing in…</>
              : "Sign In"}
          </button>
        </form>

        <div className="mt-lg text-center font-label-sm text-on-surface-variant">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-bold hover:underline">Create account</Link>
        </div>

        <p className="text-center font-label-sm text-on-surface-variant mt-md opacity-60">
          🔒 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
}
