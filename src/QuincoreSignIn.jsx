// QuincoreSignIn.jsx — QuinCore Bank Login
import React, { useState } from "react";
import {
  Box, Container, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, CircularProgress, Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, AccountBalanceWallet, Email, Lock } from "@mui/icons-material";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

export default function QuincoreSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError(""); setResetMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many failed attempts. Please try again later.",
        "auth/user-disabled": "This account has been disabled.",
      };
      setError(msgs[err.code] || "Sign-in failed. Please check your credentials.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: "Enter your email above to reset password" });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Password reset email sent! Check your inbox.");
      setError("");
    } catch {
      setError("Could not send reset email. Please check the email address.");
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0533 0%, #2d0e5a 40%, #0d1b4b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", py: 4, px: 2,
    }}>
      <Container maxWidth="xs">
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: "#7c5cbf", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px #7c5cbf88" }}>
              <AccountBalanceWallet sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", letterSpacing: "-0.5px" }}>
              QuinCore <span style={{ color: "#a78bfa" }}>Bank</span>
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#a0a0c0", mt: 1 }}>
            Secure online banking
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to access your QuinCore account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {resetMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{resetMsg}</Alert>}

          <Box component="form" onSubmit={handleSignIn} noValidate>
            <TextField fullWidth label="Email Address" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
              error={!!fieldErrors.email} helperText={fieldErrors.email}
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />

            <TextField fullWidth label="Password" type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
              error={!!fieldErrors.password} helperText={fieldErrors.password}
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>,
              }} />

            <Box sx={{ textAlign: "right", mb: 2.5 }}>
              <Typography variant="caption" component="span"
                onClick={handleForgotPassword}
                sx={{ color: "#7c5cbf", cursor: "pointer", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>
                Forgot password?
              </Typography>
            </Box>

            <Button fullWidth type="submit" variant="contained" disabled={loading}
              sx={{ borderRadius: 3, bgcolor: "#7c5cbf", "&:hover": { bgcolor: "#6a4da6" }, py: 1.4, fontWeight: 700, fontSize: "0.95rem" }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#7c5cbf", fontWeight: 700, textDecoration: "none" }}>
              Create Account
            </Link>
          </Typography>
        </Paper>

        <Typography variant="caption" sx={{ color: "#606080", display: "block", textAlign: "center", mt: 3 }}>
          🔒 Protected by 256-bit SSL encryption
        </Typography>
      </Container>
    </Box>
  );
}
