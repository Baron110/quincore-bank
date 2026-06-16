import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { generateAccountNumber, getAccountType } from "../utils";
import { COUNTRIES, CURRENCIES } from "../utils/countries";
import { generateTransactionsForCountry } from "../utils/transactionTemplates";

const ADMIN_SECRET  = "QCADMIN2026";
const DEPOSIT_OPTS  = [500, 1000, 2500, 5000, 10000, 25000];
const STEPS         = ["Invite Code", "Personal Info", "Contact & Address", "Security", "Account Setup"];

const OCCUPATIONS = [
  "Student", "Employed (Full-time)", "Employed (Part-time)", "Self-Employed / Freelancer",
  "Business Owner", "Doctor / Healthcare", "Engineer", "Lawyer", "Teacher / Educator",
  "Artist / Creative", "Military / Government", "Retired", "Unemployed", "Other",
];

// ── Fake transaction generator ─────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate();
  const [step,         setStep]         = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [showPin,      setShowPin]      = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [inviteCode,   setInviteCode]   = useState("");
  const [verifying,    setVerifying]    = useState(false);

  // Account setup features
  const [generateHistory, setGenerateHistory] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [historyEndDate, setHistoryEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [billingMode,     setBillingMode]     = useState(false);
  const [billingMessage,  setBillingMessage]  = useState("");

  // Contact support
  const [supportType,    setSupportType]    = useState(""); // "whatsapp" | "gmail"
  const [supportContact, setSupportContact] = useState("");

  // Admin/VIP section
  const [showAdminSection,  setShowAdminSection]  = useState(false);
  const [adminPwInput,      setAdminPwInput]      = useState("");
  const [adminPwError,      setAdminPwError]      = useState("");
  const [adminUnlocked,     setAdminUnlocked]     = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", dateOfBirth: "", occupation: "",
    phone: "", address: "", city: "", country: "",
    currency: "USD", currencySymbol: "$",
    password: "", confirmPassword: "", pin: "",
    initialDeposit: 1000, customDeposit: "",
  });

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm(prev => {
      const next = { ...prev, [field]: val };
      if (field === "country") {
        const found = COUNTRIES.find(c => c.name === val);
        if (found) { next.currency = found.currency; next.currencySymbol = found.symbol; }
      }
      return next;
    });
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
  };

  const verifyAdminCode = () => {
    if (adminPwInput === ADMIN_SECRET) {
      setAdminUnlocked(true); setAdminPwError(""); setShowAdminSection(true);
    } else {
      setAdminPwError("Incorrect code. Access denied.");
    }
    setAdminPwInput("");
  };

  const verifyCode = async () => {
    if (!inviteCode.trim()) { setError("Please enter your invite code."); return; }
    setVerifying(true); setError("");
    try {
      const codeRef  = doc(db, "invite_codes", inviteCode.trim().toUpperCase());
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) { setError("Invalid invite code. Please check and try again."); return; }
      if (codeSnap.data().used) { setError("This invite code has already been used."); return; }
      setStep(1);
    } catch { setError("Could not verify code. Please try again."); }
    finally { setVerifying(false); }
  };

  const validate = () => {
    const errs = {};
    if (step === 1) {
      if (!form.firstName.trim()) errs.firstName   = "Required";
      if (!form.lastName.trim())  errs.lastName    = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
      if (!form.occupation)       errs.occupation  = "Required";
      if (!form.dateOfBirth) { errs.dateOfBirth = "Required"; }
      else {
        const age = (Date.now() - new Date(form.dateOfBirth)) / (1000*60*60*24*365.25);
        if (age < 18) errs.dateOfBirth = "Must be 18+";
      }
    }
    if (step === 2) {
      if (!form.phone.trim())   errs.phone   = "Required";
      if (!form.address.trim()) errs.address = "Required";
      if (!form.city.trim())    errs.city    = "Required";
      if (!form.country)        errs.country = "Select a country";
    }
    if (step === 3) {
      if (form.password.length < 8)              errs.password        = "Min 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
      if (!/^\d{4,6}$/.test(form.pin))           errs.pin             = "4–6 digits only";
    }
    if (step === 4) {
      const d = form.customDeposit ? parseFloat(form.customDeposit) : form.initialDeposit;
      if (isNaN(d) || d < 100) errs.deposit = "Minimum deposit is 100";
      if (adminUnlocked && billingMode && !billingMessage.trim()) errs.billingMessage = "Enter a billing message";
      if (adminUnlocked && supportType && !supportContact.trim()) errs.supportContact = "Enter your contact detail";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const deposit     = form.customDeposit ? parseFloat(form.customDeposit) : form.initialDeposit;
      const { user }    = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const accountNumber = generateAccountNumber();
      const fullName    = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const accountType = getAccountType(deposit);
      const transactions = generateHistory
        ? generateTransactionsForCountry(deposit, form.country, historyStartDate, historyEndDate)
        : [{
        id: `TXN${Date.now()}`, type: "deposit", amount: deposit,
        description: "Initial deposit — Welcome to QuinCore Bank",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date().toLocaleTimeString(), status: "Completed", category: "Income",
        icon: "account_balance_wallet", color: "bg-primary-fixed",
      }];

      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), fullName,
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(), dateOfBirth: form.dateOfBirth,
        occupation: form.occupation,
        address: `${form.address.trim()}, ${form.city.trim()}`,
        country: form.country, currency: form.currency, currencySymbol: form.currencySymbol,
        accountNumber, balance: deposit, pin: form.pin, accountType,
        inviteCode: inviteCode.trim().toUpperCase(),
        billingMode:    adminUnlocked ? billingMode : false,
        billingMessage: adminUnlocked && billingMode ? billingMessage.trim() : "",
        supportType:    adminUnlocked ? supportType : "",
        supportContact: adminUnlocked && supportType ? supportContact.trim() : "",
        createdAt: serverTimestamp(),
        transactions,
        issuedCard: {
          cardNumber: `${Math.floor(1000+Math.random()*9000)} ${Math.floor(1000+Math.random()*9000)} ${Math.floor(1000+Math.random()*9000)} ${form.pin.slice(-4).padStart(4,"0")}`,
          cardHolder: fullName, expiry: "12/27",
          cvv: String(Math.floor(100 + Math.random() * 900)),
          limit: { Platinum: 50000, Gold: 20000, Silver: 10000, Bronze: 5000 }[accountType],
          network: "Mastercard",
        },
      });

      await updateDoc(doc(db, "invite_codes", inviteCode.trim().toUpperCase()), {
        used: true, usedBy: form.email.toLowerCase().trim(), usedAt: new Date().toISOString(),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "An account already exists with this email."
        : err.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  const depositVal = form.customDeposit ? parseFloat(form.customDeposit) || 0 : form.initialDeposit;
  const inputCls   = (field) =>
    `w-full px-3 py-3 rounded-lg border ${fieldErrors[field] ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary transition-colors bg-white text-sm`;

  const stepContent = [
    // ── Step 0 — Invite Code ──────────────────────────────────────────────────
    <div className="space-y-4" key="s0">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-[32px]">vpn_key</span>
        </div>
        <p className="text-sm text-on-surface-variant">Enter your exclusive QuinCore invite code to get started</p>
      </div>
      <div>
        <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Invite Code</label>
        <input
          className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm text-center tracking-widest font-bold uppercase"
          placeholder="QCB-XXXXXXXXXX" value={inviteCode} maxLength={14}
          onChange={e => { setInviteCode(e.target.value.toUpperCase()); setError(""); }} />
        {error && <p className="text-error text-xs mt-1 text-center">{error}</p>}
      </div>
      <button onClick={verifyCode} disabled={verifying}
        className="w-full bg-primary text-on-primary rounded-lg py-3 text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
        {verifying ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Verifying…</> : "Verify Code →"}
      </button>
    </div>,

    // ── Step 1 — Personal Info ────────────────────────────────────────────────
    <div className="space-y-4" key="s1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-primary block mb-1">First Name</label>
          <input className={inputCls("firstName")} value={form.firstName} onChange={set("firstName")} placeholder="John" />
          {fieldErrors.firstName && <p className="text-error text-xs mt-1">{fieldErrors.firstName}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-primary block mb-1">Last Name</label>
          <input className={inputCls("lastName")} value={form.lastName} onChange={set("lastName")} placeholder="Doe" />
          {fieldErrors.lastName && <p className="text-error text-xs mt-1">{fieldErrors.lastName}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Email Address</label>
        <input className={inputCls("email")} type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" />
        {fieldErrors.email && <p className="text-error text-xs mt-1">{fieldErrors.email}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Occupation</label>
        <select className={inputCls("occupation")} value={form.occupation} onChange={set("occupation")}>
          <option value="">Select occupation</option>
          {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {fieldErrors.occupation && <p className="text-error text-xs mt-1">{fieldErrors.occupation}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Date of Birth</label>
        <input
          className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.dateOfBirth ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm box-border`}
          type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} style={{ colorScheme: "light" }} />
        {fieldErrors.dateOfBirth
          ? <p className="text-error text-xs mt-1">{fieldErrors.dateOfBirth}</p>
          : <p className="text-xs text-on-surface-variant mt-1">Must be 18 or older</p>}
      </div>
    </div>,

    // ── Step 2 — Contact & Address ────────────────────────────────────────────
    <div className="space-y-4" key="s2">
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Phone Number</label>
        <input className={inputCls("phone")} value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
        {fieldErrors.phone && <p className="text-error text-xs mt-1">{fieldErrors.phone}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Street Address</label>
        <input className={inputCls("address")} value={form.address} onChange={set("address")} placeholder="123 Main Street" />
        {fieldErrors.address && <p className="text-error text-xs mt-1">{fieldErrors.address}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-primary block mb-1">City</label>
          <input className={inputCls("city")} value={form.city} onChange={set("city")} placeholder="New York" />
          {fieldErrors.city && <p className="text-error text-xs mt-1">{fieldErrors.city}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-primary block mb-1">Country</label>
          <select
            className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.country ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
            value={form.country} onChange={set("country")}>
            <option value="">Select country</option>
            {COUNTRIES.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          {fieldErrors.country && <p className="text-error text-xs mt-1">{fieldErrors.country}</p>}
        </div>
      </div>
      {form.country && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-primary block">Preferred Currency</label>
          <select
            className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
            value={form.currency}
            onChange={e => {
              const found = CURRENCIES.find(c => c.code === e.target.value);
              if (found) setForm(p => ({ ...p, currency: found.code, currencySymbol: found.symbol }));
            }}>
            {CURRENCIES.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code}) {c.symbol}</option>
            ))}
          </select>
          <div className="p-3 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-semibold">
            ✓ Selected: <strong>{form.currency} — {CURRENCIES.find(c => c.code === form.currency)?.name || ""}</strong>
          </div>
        </div>
      )}
    </div>,

    // ── Step 3 — Security ─────────────────────────────────────────────────────
    <div className="space-y-4" key="s3">
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Password</label>
        <div className="relative">
          <input
            className={`w-full px-3 py-3 pr-10 rounded-lg border ${fieldErrors.password ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
            type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">{showPw ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {fieldErrors.password && <p className="text-error text-xs mt-1">{fieldErrors.password}</p>}
        {form.password && (
          <div className="mt-1">
            <div className="w-full bg-surface-container-low h-1 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${form.password.length >= 10 ? "bg-green-500 w-full" : form.password.length >= 8 ? "bg-amber-500 w-2/3" : "bg-error w-1/3"}`} />
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {form.password.length >= 10 ? "Strong" : form.password.length >= 8 ? "Medium" : "Weak"} password
            </p>
          </div>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Confirm Password</label>
        <input
          className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.confirmPassword ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
          type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password" />
        {fieldErrors.confirmPassword && <p className="text-error text-xs mt-1">{fieldErrors.confirmPassword}</p>}
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Transaction PIN (4–6 digits)</label>
        <div className="relative">
          <input
            className={`w-full px-3 py-3 pr-10 rounded-lg border ${fieldErrors.pin ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
            type={showPin ? "text" : "password"} value={form.pin} onChange={set("pin")} maxLength={6} inputMode="numeric" placeholder="e.g. 4821" />
          <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">{showPin ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {fieldErrors.pin
          ? <p className="text-error text-xs mt-1">{fieldErrors.pin}</p>
          : <p className="text-xs text-on-surface-variant mt-1">Used for card & transaction verification</p>}
      </div>
    </div>,

    // ── Step 4 — Account Setup ────────────────────────────────────────────────
    <div className="space-y-4" key="s4">
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Choose your initial deposit ({form.currencySymbol})</p>
      <div className="flex flex-wrap gap-2">
        {DEPOSIT_OPTS.map(amt => (
          <button key={amt} type="button"
            onClick={() => { setForm(p => ({ ...p, initialDeposit: amt, customDeposit: "" })); setFieldErrors(p => ({ ...p, deposit: "" })); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${form.initialDeposit === amt && !form.customDeposit ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary"}`}>
            {form.currencySymbol}{amt.toLocaleString()}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs font-semibold text-primary block mb-1">Or enter a custom amount</label>
        <input
          className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.deposit ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
          type="number" value={form.customDeposit} onChange={set("customDeposit")} placeholder="Minimum 100" />
        {fieldErrors.deposit && <p className="text-error text-xs mt-1">{fieldErrors.deposit}</p>}
      </div>

      {/* ── Admin / VIP Only Section ── */}
      {!adminUnlocked ? (
        <div className="border border-outline-variant rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdminSection(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-container-low hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">admin_panel_settings</span>
              <span className="text-xs font-bold text-primary">Admin / VIP Configuration</span>
              <span className="bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">RESTRICTED</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              {showAdminSection ? "expand_less" : "expand_more"}
            </span>
          </button>
          {showAdminSection && !adminUnlocked && (
            <div className="p-4 space-y-3 border-t border-outline-variant bg-surface-container-lowest">
              <p className="text-xs text-on-surface-variant text-center">Enter admin access code to unlock</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary bg-white text-center tracking-widest font-bold"
                  type="password" placeholder="Admin code"
                  value={adminPwInput}
                  onChange={e => { setAdminPwInput(e.target.value); setAdminPwError(""); }}
                  onKeyDown={e => e.key === "Enter" && verifyAdminCode()} />
                <button type="button" onClick={verifyAdminCode}
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95">
                  Unlock
                </button>
              </div>
              {adminPwError && <p className="text-error text-xs text-center font-semibold">{adminPwError}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-primary/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary-fixed">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span className="text-xs font-bold text-primary">Admin / VIP Configuration — Unlocked</span>
          </div>

          <div className="p-4 space-y-4 bg-surface-container-lowest">

            {/* Generate Transaction History */}
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Transaction History</p>
              <div onClick={() => setGenerateHistory(v => !v)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${generateHistory ? "border-primary bg-primary-fixed" : "border-outline-variant bg-surface-container-low"}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${generateHistory ? "bg-primary border-primary" : "border-outline-variant"}`}>
                  {generateHistory && <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>}
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">Generate Transaction History</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Auto-generate realistic transactions based on {form.country || "selected country"} merchants.</p>
                </div>
              </div>
              {generateHistory && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-on-surface-variant">Choose the date range for transactions:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-primary block mb-1 uppercase tracking-wider">Start Date</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm box-border"
                        type="date" value={historyStartDate}
                        max={historyEndDate}
                        onChange={e => setHistoryStartDate(e.target.value)}
                        style={{ colorScheme: "light" }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-primary block mb-1 uppercase tracking-wider">End Date</label>
                      <input
                        className="w-full px-3 py-2.5 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm box-border"
                        type="date" value={historyEndDate}
                        min={historyStartDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={e => setHistoryEndDate(e.target.value)}
                        style={{ colorScheme: "light" }} />
                    </div>
                  </div>
                  <div className="bg-secondary-container p-2 rounded-lg">
                    <p className="text-[10px] text-on-secondary-container font-semibold">
                      📍 Transactions will use {form.country || "your selected country"} merchants & amounts
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-outline-variant" />

            {/* Billing Mode */}
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Billing / Restricted Mode</p>
              <div onClick={() => setBillingMode(v => !v)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${billingMode ? "border-error bg-error-container/30" : "border-outline-variant bg-surface-container-low"}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${billingMode ? "bg-error border-error" : "border-outline-variant"}`}>
                  {billingMode && <span className="material-symbols-outlined text-on-error text-[14px]">check</span>}
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">Enable Billing Mode</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">All transactions blocked. Account looks normal. Shows custom message.</p>
                </div>
              </div>
              {billingMode && (
                <div className="mt-2">
                  <textarea
                    className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.billingMessage ? "border-error" : "border-error/50"} focus:outline-none focus:border-error bg-white text-sm resize-none`}
                    rows={3} placeholder="e.g. Your account has been temporarily restricted. Contact support@quincore.online"
                    value={billingMessage}
                    onChange={e => { setBillingMessage(e.target.value); setFieldErrors(p => ({ ...p, billingMessage: "" })); }} />
                  {fieldErrors.billingMessage && <p className="text-error text-xs mt-1">{fieldErrors.billingMessage}</p>}
                  <p className="text-xs text-on-surface-variant mt-1">⚠️ This message is permanent and cannot be changed by the user.</p>
                </div>
              )}
            </div>

            <div className="h-px bg-outline-variant" />

            {/* Contact Support */}
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Contact Support Setup</p>
              <div className="flex gap-2 mb-3">
                {[["whatsapp","WhatsApp","chat"],["gmail","Gmail","mail"]].map(([val, label, icon]) => (
                  <button key={val} type="button"
                    onClick={() => { setSupportType(t => t === val ? "" : val); setSupportContact(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${supportType === val ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant hover:border-primary"}`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
              {supportType === "whatsapp" && (
                <div>
                  <input
                    className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.supportContact ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
                    placeholder="e.g. https://wa.me/1234567890"
                    value={supportContact}
                    onChange={e => { setSupportContact(e.target.value); setFieldErrors(p => ({ ...p, supportContact: "" })); }} />
                  <p className="text-xs text-on-surface-variant mt-1">WhatsApp link format: https://wa.me/[country code][number]</p>
                  {fieldErrors.supportContact && <p className="text-error text-xs mt-1">{fieldErrors.supportContact}</p>}
                </div>
              )}
              {supportType === "gmail" && (
                <div>
                  <input
                    className={`w-full px-3 py-3 rounded-lg border ${fieldErrors.supportContact ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`}
                    type="email" placeholder="e.g. support@quincore.online"
                    value={supportContact}
                    onChange={e => { setSupportContact(e.target.value); setFieldErrors(p => ({ ...p, supportContact: "" })); }} />
                  {fieldErrors.supportContact && <p className="text-error text-xs mt-1">{fieldErrors.supportContact}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Preview */}
      {depositVal >= 100 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3 space-y-2">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Account Preview</p>
          {[
            ["Name",             `${form.firstName} ${form.lastName}`],
            ["Occupation",       form.occupation || "—"],
            ["Currency",         `${form.currency} (${form.currencySymbol})`],
            ["Opening balance",  `${form.currencySymbol}${depositVal.toLocaleString()}`],
            ["Account tier",     getAccountType(depositVal)],
            ["Txn history",      generateHistory ? "✅ Auto-generated" : "Standard"],
            ...(adminUnlocked ? [
              ["Account mode",   billingMode ? "🔒 Billing/Restricted" : "✅ Normal"],
              ["Support",        supportType ? `${supportType === "whatsapp" ? "WhatsApp" : "Gmail"} — ${supportContact || "not set"}` : "Not configured"],
            ] : []),
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-xs text-on-surface-variant">{label}</span>
              <span className="text-xs font-bold text-primary text-right max-w-[60%] truncate">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary text-[28px]">account_balance</span>
          <h1 className="font-hanken text-xl font-bold text-primary">QuinCore Bank</h1>
        </div>
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-surface-container-high"}`} />
          ))}
        </div>
        <h2 className="font-hanken text-2xl font-bold text-primary mb-0.5">{STEPS[step]}</h2>
        <p className="text-xs text-on-surface-variant mb-5">Step {step + 1} of {STEPS.length}</p>
        {error && step !== 0 && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-xs font-semibold">{error}</div>
        )}
        {stepContent[step]}
        {step > 0 && (
          <div className="flex gap-3 mt-5">
            <button onClick={back} type="button"
              className="flex-1 border border-outline-variant rounded-lg py-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next} type="button"
                className="flex-1 bg-primary text-on-primary rounded-lg py-3 text-xs font-bold active:scale-95 transition-transform">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} type="button"
                className="flex-1 bg-primary text-on-primary rounded-lg py-3 text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Creating…</> : "Create Account 🎉"}
              </button>
            )}
          </div>
        )}
        <div className="mt-4 text-center text-xs text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}"// force rebuild"  
