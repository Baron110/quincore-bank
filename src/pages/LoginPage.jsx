import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE       = "service_sn7i0ob";
const EMAILJS_TEMPLATE      = "template_239am4e"; // transaction receipts
const EMAILJS_OTP_TEMPLATE  = "template_ba8hkn4"; // 2FA security alert
const EMAILJS_KEY           = "qyX5zHQs3vzkNzM7m";

// A throwaway second Firebase app used ONLY to verify a password.
// Signing in here does NOT change the main auth state, so the login page
// stays mounted and the OTP screen can render.
const verifierConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};
const getVerifierAuth = () => {
  const existing = getApps().find(a => a.name === "verifier");
  return getAuth(existing || initializeApp(verifierConfig, "verifier"));
};

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [resetMsg,     setResetMsg]     = useState("");
  const [loading,      setLoading]      = useState(false);

  // 2FA states
  const [step,       setStep]       = useState(1);
  const [otpSent,    setOtpSent]    = useState("");
  const [otpInput,   setOtpInput]   = useState("");
  const [otpExpiry,  setOtpExpiry]  = useState(null);
  const [verifying,  setVerifying]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setResetMsg(""); setLoading(true);
    try {
      // 1. Validate the password on the verifier app — main auth stays untouched,
      //    so <Public> does not redirect us away from this page.
      const vAuth = getVerifierAuth();
      const cred  = await signInWithEmailAndPassword(vAuth, email, password);
      const uid   = cred.user.uid;

      // 2. Read the profile — QCB2 accounts always get 2FA, plus anyone who
      //    has opted into it themselves from their profile settings.
      let needsOTP = false;
      let userName = "User";
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const d  = snap.data();
        userName = d.fullName || "User";
        const isAdmin2   = d.adminGroup === "admin2" || String(d.inviteCode || "").startsWith("QCB2-");
        const optedIn    = d.twoFactorEnabled === true;
        needsOTP = isAdmin2 || optedIn;
      }

      // 3. Tear down the verifier session — it was only ever a password check.
      await signOut(vAuth);

      if (!needsOTP) {
        // Normal user — sign into the real auth. <Public> will send them to /dashboard.
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
        return;
      }

      // 4. 2FA required — email an OTP and show the verification screen.
      //    We are still signed OUT of the main auth, so this page stays mounted.
      const otp    = generateOTP();
      const expiry = Date.now() + 20 * 60 * 1000; // 20 minutes

      try {
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_OTP_TEMPLATE, {
          to_email:         email,
          recipient_name:   userName,
          subject:          "QuinCore Bank — Login Verification Code",
          message:          `Hello ${userName},\n\nYour login verification code is:\n\n${otp}\n\nThis code expires in 20 minutes. Do NOT share this code with anyone.\n\nIf you did not attempt to login, secure your account immediately.`,
          transaction_type: "2FA Security Alert",
          amount:           otp,
          date:             new Date().toLocaleString(),
          transaction_id:   `2FA-${Date.now()}`,
          new_balance:      "N/A",
          footer_note:      "QuinCore Bank Security Team",
        }, EMAILJS_KEY);
      } catch {
        setError("Could not send the verification email. Check your inbox or try again.");
      }

      setOtpSent(otp);
      setOtpExpiry(expiry);
      setStep(2);
    } catch (err) {
      const msgs = {
        "auth/user-not-found":    "No account found with this email.",
        "auth/wrong-password":    "Incorrect password.",
        "auth/invalid-credential":"Invalid email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setError(msgs[err.code] || "Sign-in failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setError("");
    if (Date.now() > otpExpiry)      { setError("Code expired. Please login again."); setStep(1); return; }
    if (otpInput.trim() !== otpSent) { setError("Incorrect code. Please try again."); setOtpInput(""); return; }
    setVerifying(true);
    try {
      // Only now do we touch the real auth session.
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch {
      setError("Session expired. Please sign in again.");
      setStep(1);
    } finally { setVerifying(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email address first."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Password reset email sent! Check your inbox.");
    } catch { setError("Could not send reset email. Check the email address."); }
    finally { setLoading(false); }
  };

  // ── OTP Screen ──────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl border border-outline-variant p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-[32px]">shield</span>
            </div>
            <h2 className="font-hanken text-2xl font-bold text-primary">Verify Your Identity</h2>
            <p className="text-xs text-on-surface-variant mt-2">
              A 6-digit code was sent to <strong>{email}</strong>
            </p>
            <p className="text-xs text-on-surface-variant">Code expires in 20 minutes</p>
          </div>

          {error && <p className="text-error text-xs font-bold text-center mb-4">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Enter Verification Code</label>
              <input
                className="w-full px-3 py-3 rounded-lg border border-outline-variant text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-primary bg-white"
                type="text" maxLength={6} inputMode="numeric"
                placeholder="000000"
                value={otpInput}
                onChange={e => { setOtpInput(e.target.value.replace(/\D/g,"")); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleVerifyOTP()} />
            </div>
            <button onClick={handleVerifyOTP} disabled={verifying || otpInput.length < 6}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {verifying
                ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Verifying…</>
                : "Verify & Login"}
            </button>
            <button onClick={() => { setStep(1); setOtpInput(""); setError(""); }} disabled={verifying}
              className="w-full border border-outline-variant text-on-surface-variant py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Login Screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl border border-outline-variant p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-[28px]">account_balance</span>
          <h1 className="font-hanken text-xl font-bold text-primary">QuinCore Bank</h1>
        </div>
        <h2 className="font-hanken text-2xl font-bold text-primary mb-1">Welcome back</h2>
        <p className="text-xs text-on-surface-variant mb-6">Sign in to your account</p>

        {error    && <p className="text-error text-xs font-bold mb-4">{error}</p>}
        {resetMsg && <p className="text-green-600 text-xs font-bold mb-4">{resetMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Email</label>
            <input
              className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
              type="email" placeholder="you@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }} required />
          </div>
          <div>
            <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                className="w-full px-3 py-3 pr-10 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
                type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }} required />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            <button type="button" onClick={handleForgotPassword}
              className="text-xs text-primary font-bold mt-1 hover:underline">
              Forgot password?
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Signing in…</>
              : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}