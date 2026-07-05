import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE  = "service_sn7i0ob";
const EMAILJS_TEMPLATE = "template_239am4e";
const EMAILJS_KEY      = "qyX5zHQs3vzkNzM7m";

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPassword,setShowPassword]= useState(false);
  const [error,       setError]       = useState("");
  const [resetMsg,    setResetMsg]    = useState("");
  const [loading,     setLoading]     = useState(false);

  // 2FA states
  const [step,        setStep]        = useState(1); // 1=login, 2=otp
  const [otpSent,     setOtpSent]     = useState("");
  const [otpInput,    setOtpInput]    = useState("");
  const [otpEmail,    setOtpEmail]    = useState("");
  const [verifying,   setVerifying]   = useState(false);
  const [otpExpiry,   setOtpExpiry]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setResetMsg(""); setLoading(true);
    try {
      // Step 1 — Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);

      // Step 2 — Check if QCB2 user (do this separately so it doesn't break normal login)
      let isAdmin2 = false;
      let userName = "User";
      try {
        const q    = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].data().adminGroup === "admin2") {
          isAdmin2 = true;
          userName = snap.docs[0].data().fullName || "User";
        }
      } catch { isAdmin2 = false; }

      if (isAdmin2) {
        // Sign out temporarily until OTP verified
        await firebaseSignOut(auth);

        const otp    = generateOTP();
        const expiry = Date.now() + 10 * 60 * 1000;

        try {
          await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
            to_email:         email,
            recipient_name:   userName,
            subject:          "QuinCore Bank — Login Verification Code",
            message:          `Hello ${userName},\n\nYour 2-Factor Authentication code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nDo NOT share this code with anyone. QuinCore Bank will never ask for this code.\n\nIf you did not request this, please change your password immediately.`,
            transaction_type: "2FA Security Alert",
            amount:           otp,
            date:             new Date().toLocaleString(),
            transaction_id:   `2FA-${Date.now()}`,
            new_balance:      "N/A",
            footer_note:      "This is an automated security message from QuinCore Bank.",
          }, EMAILJS_KEY);
        } catch { /* Email failed but continue anyway */ }

        setOtpSent(otp);
        setOtpEmail(email);
        setOtpExpiry(expiry);
        setStep(2);
      } else {
        // Normal user — go straight to dashboard
        navigate("/dashboard");
      }
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
    if (Date.now() > otpExpiry) { setError("Code expired. Please login again."); setStep(1); return; }
    if (otpInput !== otpSent) { setError("Incorrect code. Please try again."); setOtpInput(""); return; }
    setVerifying(true);
    try {
      await signInWithEmailAndPassword(auth, otpEmail, password);
      navigate("/dashboard");
    } catch { setError("Login failed. Please try again."); setStep(1); }
    finally { setVerifying(false); }
  };

  const handleReset = async () => {
    if (!email) { setError("Enter your email above first."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Reset link sent! Check your inbox.");
      setError("");
    } catch { setError("Could not send reset email."); }
  };

  // ── OTP Step ─────────────────────────────────────────────────────────────
  if (step === 2) {
    const timeLeft = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
      <div className="min-h-screen flex items-center justify-center p-gutter bg-background">
        <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-xl">
          <div className="text-center mb-lg">
            <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-[32px]">mark_email_read</span>
            </div>
            <h1 className="font-hanken text-headline-md text-primary">Verify Your Identity</h1>
            <p className="text-xs text-on-surface-variant mt-2">
              A 6-digit code was sent to <strong>{otpEmail}</strong>
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Expires in {mins}:{String(secs).padStart(2,"0")}
            </p>
          </div>

          {error && <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-xs font-semibold">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Enter 6-Digit Code</label>
              <input
                className="w-full px-4 py-4 rounded-lg border border-outline-variant text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-primary bg-white"
                type="text" maxLength={6} inputMode="numeric"
                placeholder="000000"
                value={otpInput}
                onChange={e => { setOtpInput(e.target.value.replace(/\D/g,"")); setError(""); }} />
            </div>

            <button onClick={handleVerifyOTP} disabled={verifying || otpInput.length !== 6}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {verifying
                ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Verifying…</>
                : "Verify & Sign In"}
            </button>

            <button onClick={() => { setStep(1); setOtpInput(""); setError(""); }}
              className="w-full border border-outline-variant text-on-surface-variant py-3 rounded-lg text-xs font-bold active:scale-95">
              Back to Login
            </button>
          </div>

          <p className="text-center text-xs text-on-surface-variant mt-4 opacity-60">
            🔒 2-Factor Authentication — QuinCore Bank
          </p>
        </div>
      </div>
    );
  }

  // ── Login Step ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-gutter bg-background">
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-xl">
        <div className="text-center mb-lg">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>account_balance</span>
          <h1 className="font-hanken text-headline-md text-primary mt-2">QuinCore Bank</h1>
          <p className="font-label-md text-on-surface-variant mt-xs">Premium Digital Banking</p>
        </div>

        <h2 className="font-hanken text-headline-lg text-primary mb-md">Welcome back</h2>

        {error    && <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg font-label-md">{error}</div>}
        {resetMsg && <div className="mb-md p-sm bg-green-100 text-green-700 rounded-lg font-label-md">{resetMsg}</div>}

        <form className="space-y-md" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="font-label-md text-label-md text-primary block mb-xs">Email</label>
            <input
              className="w-full px-md py-sm rounded-lg border border-outline-variant font-body-sm focus:outline-none focus:border-primary transition-colors"
              type="email" placeholder="name@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="font-label-md text-label-md text-primary block mb-xs">Password</label>
            <div className="relative">
              <input
                className="w-full px-md py-sm rounded-lg border border-outline-variant font-body-sm focus:outline-none focus:border-primary transition-colors pr-12"
                type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
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

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-sm">
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