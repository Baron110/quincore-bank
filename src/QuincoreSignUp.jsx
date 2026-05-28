// QuincoreSignUp.jsx — QuinCore Bank Registration (Multi-Step)
import React, { useState } from "react";
import {
  Box, Container, Paper, Typography, TextField, Button, MenuItem,
  Select, InputLabel, FormControl, Stepper, Step, StepLabel,
  InputAdornment, IconButton, Alert, CircularProgress, Divider,
  Grid, LinearProgress,
} from "@mui/material";
import {
  Visibility, VisibilityOff, AccountBalanceWallet, Person,
  Email, Phone, Home, CalendarToday, Language, Lock,
} from "@mui/icons-material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

const COUNTRIES = [
  { name: "Canada", code: "CA", currency: "CAD", symbol: "CA$" },
  { name: "United States", code: "US", currency: "USD", symbol: "$" },
  { name: "United Kingdom", code: "GB", currency: "GBP", symbol: "£" },
  { name: "Australia", code: "AU", currency: "AUD", symbol: "A$" },
  { name: "Germany", code: "DE", currency: "EUR", symbol: "€" },
  { name: "France", code: "FR", currency: "EUR", symbol: "€" },
  { name: "Netherlands", code: "NL", currency: "EUR", symbol: "€" },
  { name: "Spain", code: "ES", currency: "EUR", symbol: "€" },
  { name: "Italy", code: "IT", currency: "EUR", symbol: "€" },
  { name: "Nigeria", code: "NG", currency: "USD", symbol: "$" },
  { name: "Ghana", code: "GH", currency: "USD", symbol: "$" },
  { name: "South Africa", code: "ZA", currency: "USD", symbol: "$" },
  { name: "India", code: "IN", currency: "USD", symbol: "$" },
  { name: "Other", code: "OT", currency: "USD", symbol: "$" },
];

const DEPOSIT_OPTIONS = [500, 1000, 2500, 5000, 10000, 25000];
const STEPS = ["Personal Info", "Contact & Address", "Security", "Account Setup"];

function generateAccountNumber() {
  return `QC${Math.floor(100000000000 + Math.random() * 900000000000)}`;
}
function getAccountType(balance) {
  if (balance >= 50000) return "Platinum";
  if (balance >= 10000) return "Gold";
  if (balance >= 2500) return "Silver";
  return "Bronze";
}
function getTierColor(tier) {
  return { Platinum: "#b28900", Gold: "#d4a017", Silver: "#707070", Bronze: "#cd7f32" }[tier] || "#7c5cbf";
}

export default function QuincoreSignUp() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", dateOfBirth: "",
    phone: "", address: "", city: "", country: "",
    currency: "USD", currencySymbol: "$",
    password: "", confirmPassword: "", pin: "",
    initialDeposit: 1000, customDeposit: "",
  });

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "country") {
        const found = COUNTRIES.find((c) => c.name === value);
        if (found) { updated.currency = found.currency; updated.currencySymbol = found.symbol; }
      }
      return updated;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (activeStep === 0) {
      if (!form.firstName.trim()) errs.firstName = "Required";
      if (!form.lastName.trim()) errs.lastName = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
      if (!form.dateOfBirth) { errs.dateOfBirth = "Required"; }
      else {
        const age = (Date.now() - new Date(form.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 18) errs.dateOfBirth = "Must be 18 or older";
      }
    }
    if (activeStep === 1) {
      if (!form.phone.trim()) errs.phone = "Required";
      if (!form.address.trim()) errs.address = "Required";
      if (!form.city.trim()) errs.city = "Required";
      if (!form.country) errs.country = "Please select a country";
    }
    if (activeStep === 2) {
      if (form.password.length < 8) errs.password = "Minimum 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
      if (!/^\d{4,6}$/.test(form.pin)) errs.pin = "PIN must be 4–6 digits";
    }
    if (activeStep === 3) {
      const d = form.customDeposit ? parseFloat(form.customDeposit) : form.initialDeposit;
      if (isNaN(d) || d < 100) errs.deposit = "Minimum initial deposit is 100";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) setActiveStep((s) => s + 1); };
  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const depositAmount = form.customDeposit ? parseFloat(form.customDeposit) : form.initialDeposit;
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const accountNumber = generateAccountNumber();
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const accountType = getAccountType(depositAmount);

      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), fullName,
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(), dateOfBirth: form.dateOfBirth,
        address: `${form.address.trim()}, ${form.city.trim()}`,
        country: form.country, currency: form.currency, currencySymbol: form.currencySymbol,
        accountNumber, balance: depositAmount, pin: form.pin, accountType,
        createdAt: serverTimestamp(),
        transactions: [{
          id: `TXN${Date.now()}`, type: "deposit", amount: depositAmount,
          description: "Initial deposit — Welcome to QuinCore Bank",
          date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(),
          status: "completed", category: "Deposit",
        }],
        issuedCard: {
          cardNumber: `**** **** **** ${form.pin.slice(-4).padStart(4, "0")}`,
          cardHolder: fullName, expiry: "12/27",
          cvv: String(Math.floor(100 + Math.random() * 900)),
          limit: { Platinum: 50000, Gold: 20000, Silver: 10000, Bronze: 5000 }[accountType],
          network: "Mastercard",
        },
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "An account already exists with this email. Please sign in."
        : err.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const depositValue = form.customDeposit ? parseFloat(form.customDeposit) || 0 : form.initialDeposit;
  const pwStrength = Math.min(100,
    form.password.length * 8 +
    (/[A-Z]/.test(form.password) ? 10 : 0) +
    (/[0-9]/.test(form.password) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(form.password) ? 15 : 0)
  );

  const stepContent = [
    // STEP 0
    <Grid container spacing={2} key="s0">
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="First Name" value={form.firstName} onChange={handleChange("firstName")}
          error={!!fieldErrors.firstName} helperText={fieldErrors.firstName}
          InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Last Name" value={form.lastName} onChange={handleChange("lastName")}
          error={!!fieldErrors.lastName} helperText={fieldErrors.lastName}
          InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={handleChange("email")}
          error={!!fieldErrors.email} helperText={fieldErrors.email}
          InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={handleChange("dateOfBirth")}
          error={!!fieldErrors.dateOfBirth} helperText={fieldErrors.dateOfBirth || "You must be 18+ to open an account"}
          InputLabelProps={{ shrink: true }}
          InputProps={{ startAdornment: <InputAdornment position="start"><CalendarToday sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />
      </Grid>
    </Grid>,

    // STEP 1
    <Grid container spacing={2} key="s1">
      <Grid item xs={12}>
        <TextField fullWidth label="Phone Number" value={form.phone} onChange={handleChange("phone")}
          error={!!fieldErrors.phone} helperText={fieldErrors.phone}
          InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Street Address" value={form.address} onChange={handleChange("address")}
          error={!!fieldErrors.address} helperText={fieldErrors.address}
          InputProps={{ startAdornment: <InputAdornment position="start"><Home sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment> }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="City / Town" value={form.city} onChange={handleChange("city")}
          error={!!fieldErrors.city} helperText={fieldErrors.city} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!fieldErrors.country}>
          <InputLabel>Country</InputLabel>
          <Select value={form.country} onChange={handleChange("country")} label="Country">
            {COUNTRIES.map((c) => (
              <MenuItem key={c.code} value={c.name}>{c.name} — {c.currency}</MenuItem>
            ))}
          </Select>
          {fieldErrors.country && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{fieldErrors.country}</Typography>}
        </FormControl>
      </Grid>
      {form.country && (
        <Grid item xs={12}>
          <Alert severity="info" icon={<Language />} sx={{ borderRadius: 2 }}>
            Account currency: <strong>{form.currency} ({form.currencySymbol})</strong>
          </Alert>
        </Grid>
      )}
    </Grid>,

    // STEP 2
    <Grid container spacing={2} key="s2">
      <Grid item xs={12}>
        <TextField fullWidth label="Password" type={showPassword ? "text" : "password"}
          value={form.password} onChange={handleChange("password")}
          error={!!fieldErrors.password} helperText={fieldErrors.password || "Minimum 8 characters"}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>,
          }} />
        {form.password && (
          <Box sx={{ mt: 0.5 }}>
            <LinearProgress variant="determinate" value={pwStrength}
              sx={{ height: 5, borderRadius: 3, bgcolor: "#eee",
                "& .MuiLinearProgress-bar": { bgcolor: pwStrength >= 70 ? "#4caf50" : pwStrength >= 40 ? "#ff9800" : "#f44336" } }} />
            <Typography variant="caption" color="text.secondary">
              {pwStrength >= 70 ? "Strong" : pwStrength >= 40 ? "Medium" : "Weak"} password
            </Typography>
          </Box>
        )}
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Confirm Password" type={showPassword ? "text" : "password"}
          value={form.confirmPassword} onChange={handleChange("confirmPassword")}
          error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Transaction PIN (4–6 digits)" type={showPin ? "text" : "password"}
          value={form.pin} onChange={handleChange("pin")} inputProps={{ maxLength: 6, inputMode: "numeric" }}
          error={!!fieldErrors.pin} helperText={fieldErrors.pin || "Used for card & transaction verification"}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#7c5cbf", fontSize: 20 }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end">
              <IconButton onClick={() => setShowPin((v) => !v)} edge="end" size="small">
                {showPin ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>,
          }} />
      </Grid>
    </Grid>,

    // STEP 3
    <Grid container spacing={2} key="s3">
      <Grid item xs={12}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Select your initial deposit ({form.currencySymbol})
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {DEPOSIT_OPTIONS.map((amt) => (
            <Button key={amt} size="small"
              variant={form.initialDeposit === amt && !form.customDeposit ? "contained" : "outlined"}
              onClick={() => { setForm((p) => ({ ...p, initialDeposit: amt, customDeposit: "" })); setFieldErrors((p) => ({ ...p, deposit: "" })); }}
              sx={{ borderRadius: 3,
                ...(form.initialDeposit === amt && !form.customDeposit
                  ? { bgcolor: "#7c5cbf", "&:hover": { bgcolor: "#6a4da6" } }
                  : { borderColor: "#7c5cbf", color: "#7c5cbf" }) }}>
              {form.currencySymbol}{amt.toLocaleString()}
            </Button>
          ))}
        </Box>
        <TextField fullWidth label="Custom amount" type="number" value={form.customDeposit} onChange={handleChange("customDeposit")}
          error={!!fieldErrors.deposit} helperText={fieldErrors.deposit || "Minimum: 100"}
          InputProps={{ startAdornment: <InputAdornment position="start">{form.currencySymbol}</InputAdornment> }} />
      </Grid>
      {depositValue >= 100 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "#f5f0ff", border: "1px solid #e0d4f5" }}>
            <Typography variant="subtitle2" fontWeight={700} color="#7c5cbf" sx={{ mb: 1 }}>Account Preview</Typography>
            {[
              ["Name", `${form.firstName} ${form.lastName}`],
              ["Country", form.country],
              ["Currency", `${form.currency} (${form.currencySymbol})`],
              ["Opening balance", `${form.currencySymbol}${depositValue.toLocaleString()}`],
              ["Account tier", getAccountType(depositValue)],
            ].map(([label, val]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600}
                  sx={label === "Account tier" ? { color: getTierColor(val) } : undefined}>{val}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      )}
    </Grid>,
  ];

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0533 0%, #2d0e5a 40%, #0d1b4b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", py: 4, px: 2,
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#7c5cbf", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AccountBalanceWallet sx={{ color: "#fff", fontSize: 24 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", letterSpacing: "-0.5px" }}>
              QuinCore <span style={{ color: "#a78bfa" }}>Bank</span>
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#a0a0c0", mt: 0.5 }}>Create your account — takes 2 minutes</Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden" }}>
          <Box sx={{ bgcolor: "#7c5cbf", px: 3, pt: 2.5, pb: 2 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{
              "& .MuiStepLabel-label": { color: "#c4b0ef", fontSize: "0.68rem", mt: "4px !important" },
              "& .MuiStepLabel-label.Mui-active": { color: "#fff", fontWeight: 700 },
              "& .MuiStepLabel-label.Mui-completed": { color: "#d4c4f0" },
              "& .MuiStepIcon-root": { color: "#5a3a9a" },
              "& .MuiStepIcon-root.Mui-active": { color: "#fff" },
              "& .MuiStepIcon-root.Mui-completed": { color: "#c4b0ef" },
              "& .MuiStepConnector-line": { borderColor: "#9a7fd4" },
            }}>
              {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700}>{STEPS[activeStep]}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
              Step {activeStep + 1} of {STEPS.length}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {stepContent[activeStep]}

            <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
              {activeStep > 0 && (
                <Button fullWidth onClick={handleBack} disabled={loading} variant="outlined"
                  sx={{ borderRadius: 3, borderColor: "#7c5cbf", color: "#7c5cbf", py: 1.2 }}>
                  Back
                </Button>
              )}
              {activeStep < STEPS.length - 1 ? (
                <Button fullWidth onClick={handleNext} variant="contained"
                  sx={{ borderRadius: 3, bgcolor: "#7c5cbf", "&:hover": { bgcolor: "#6a4da6" }, py: 1.2, fontWeight: 700 }}>
                  Continue →
                </Button>
              ) : (
                <Button fullWidth onClick={handleSubmit} disabled={loading} variant="contained"
                  sx={{ borderRadius: 3, bgcolor: "#7c5cbf", "&:hover": { bgcolor: "#6a4da6" }, py: 1.2, fontWeight: 700 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Create My Account"}
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{" "}
              <Link to="/signin" style={{ color: "#7c5cbf", fontWeight: 700, textDecoration: "none" }}>Sign In</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
