import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { generateAccountNumber, getAccountType } from "../utils";

const COUNTRIES = [
  { name: "Canada",         currency: "CAD", symbol: "CA$" },
  { name: "United States",  currency: "USD", symbol: "$" },
  { name: "United Kingdom", currency: "GBP", symbol: "£" },
  { name: "Australia",      currency: "AUD", symbol: "A$" },
  { name: "Germany",        currency: "EUR", symbol: "€" },
  { name: "France",         currency: "EUR", symbol: "€" },
  { name: "Netherlands",    currency: "EUR", symbol: "€" },
  { name: "Nigeria",        currency: "USD", symbol: "$" },
  { name: "South Africa",   currency: "USD", symbol: "$" },
  { name: "India",          currency: "USD", symbol: "$" },
  { name: "Other",          currency: "USD", symbol: "$" },
];

const DEPOSIT_OPTS = [500, 1000, 2500, 5000, 10000, 25000];
const STEPS = ["Personal Info", "Contact & Address", "Security", "Account Setup"];

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", dateOfBirth: "",
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

  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = "Required";
      if (!form.lastName.trim())  errs.lastName = "Required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
      if (!form.dateOfBirth) { errs.dateOfBirth = "Required"; }
      else {
        const age = (Date.now() - new Date(form.dateOfBirth)) / (1000*60*60*24*365.25);
        if (age < 18) errs.dateOfBirth = "Must be 18+";
      }
    }
    if (step === 1) {
      if (!form.phone.trim())   errs.phone = "Required";
      if (!form.address.trim()) errs.address = "Required";
      if (!form.city.trim())    errs.city = "Required";
      if (!form.country)        errs.country = "Select a country";
    }
    if (step === 2) {
      if (form.password.length < 8) errs.password = "Min 8 characters";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
      if (!/^\d{4,6}$/.test(form.pin)) errs.pin = "4–6 digits only";
    }
    if (step === 3) {
      const d = form.customDeposit ? parseFloat(form.customDeposit) : form.initialDeposit;
      if (isNaN(d) || d < 100) errs.deposit = "Minimum deposit is 100";
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
      const deposit = form.customDeposit ? parseFloat(form.customDeposit) : form.initialDeposit;
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const accountNumber = generateAccountNumber();
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const accountType = getAccountType(deposit);

      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), fullName,
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(), dateOfBirth: form.dateOfBirth,
        address: `${form.address.trim()}, ${form.city.trim()}`,
        country: form.country, currency: form.currency, currencySymbol: form.currencySymbol,
        accountNumber, balance: deposit, pin: form.pin, accountType,
        createdAt: serverTimestamp(),
        transactions: [{
          id: `TXN${Date.now()}`, type: "deposit", amount: deposit,
          description: "Initial deposit — Welcome to QuinCore Bank",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          time: new Date().toLocaleTimeString(),
          status: "Completed", category: "Income",
          icon: "account_balance_wallet", color: "bg-primary-fixed",
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
        ? "An account already exists with this email."
        : err.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  const depositVal = form.customDeposit ? parseFloat(form.customDeposit) || 0 : form.initialDeposit;

  const stepContent = [
    // Step 0 – Personal
    <div className="space-y-md" key="s0">
      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="font-label-md text-label-md text-primary block mb-xs">First Name</label>
          <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.firstName ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
            value={form.firstName} onChange={set("firstName")} placeholder="John" />
          {fieldErrors.firstName && <p className="text-error text-label-sm mt-xs">{fieldErrors.firstName}</p>}
        </div>
        <div>
          <label className="font-label-md text-label-md text-primary block mb-xs">Last Name</label>
          <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.lastName ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
            value={form.lastName} onChange={set("lastName")} placeholder="Doe" />
          {fieldErrors.lastName && <p className="text-error text-label-sm mt-xs">{fieldErrors.lastName}</p>}
        </div>
      </div>
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Email Address</label>
        <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.email ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
          type="email" value={form.email} onChange={set("email")} placeholder="john@example.com" />
        {fieldErrors.email && <p className="text-error text-label-sm mt-xs">{fieldErrors.email}</p>}
      </div>
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Date of Birth</label>
        <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.dateOfBirth ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
          type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        {fieldErrors.dateOfBirth
          ? <p className="text-error text-label-sm mt-xs">{fieldErrors.dateOfBirth}</p>
          : <p className="font-label-sm text-on-surface-variant mt-xs">Must be 18 or older</p>}
      </div>
    </div>,

    // Step 1 – Contact
    <div className="space-y-md" key="s1">
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Phone Number</label>
        <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.phone ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
          value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
        {fieldErrors.phone && <p className="text-error text-label-sm mt-xs">{fieldErrors.phone}</p>}
      </div>
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Street Address</label>
        <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.address ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
          value={form.address} onChange={set("address")} placeholder="123 Main Street" />
        {fieldErrors.address && <p className="text-error text-label-sm mt-xs">{fieldErrors.address}</p>}
      </div>
      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="font-label-md text-label-md text-primary block mb-xs">City</label>
          <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.city ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
            value={form.city} onChange={set("city")} placeholder="New York" />
          {fieldErrors.city && <p className="text-error text-label-sm mt-xs">{fieldErrors.city}</p>}
        </div>
        <div>
          <label className="font-label-md text-label-md text-primary block mb-xs">Country</label>
          <select className={`w-full px-md py-sm rounded-lg border ${fieldErrors.country ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary bg-white`}
            value={form.country} onChange={set("country")}>
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} — {c.currency}</option>)}
          </select>
          {fieldErrors.country && <p className="text-error text-label-sm mt-xs">{fieldErrors.country}</p>}
        </div>
      </div>
      {form.country && (
        <div className="p-sm bg-secondary-container text-on-secondary-container rounded-lg font-label-sm">
          ✓ Account currency: <strong>{form.currency} ({form.currencySymbol})</strong>
        </div>
      )}
    </div>,

    // Step 2 – Security
    <div className="space-y-md" key="s2">
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Password</label>
        <div className="relative">
          <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.password ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary pr-12`}
            type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 8 characters" />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">{showPw ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {fieldErrors.password && <p className="text-error text-label-sm mt-xs">{fieldErrors.password}</p>}
        {form.password && (
          <div className="mt-xs">
            <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${
                form.password.length >= 10 ? "bg-green-500 w-full" :
                form.password.length >= 8  ? "bg-amber-500 w-2/3" : "bg-error w-1/3"
              }`} />
            </div>
            <p className="font-label-sm text-on-surface-variant mt-xs">
              {form.password.length >= 10 ? "Strong" : form.password.length >= 8 ? "Medium" : "Weak"} password
            </p>
          </div>
        )}
      </div>
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Confirm Password</label>
        <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.confirmPassword ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
          type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password" />
        {fieldErrors.confirmPassword && <p className="text-error text-label-sm mt-xs">{fieldErrors.confirmPassword}</p>}
      </div>
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Transaction PIN (4–6 digits)</label>
        <div className="relative">
          <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.pin ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary pr-12`}
            type={showPin ? "text" : "password"} value={form.pin} onChange={set("pin")} maxLength={6} inputMode="numeric" placeholder="e.g. 4821" />
          <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">{showPin ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {fieldErrors.pin
          ? <p className="text-error text-label-sm mt-xs">{fieldErrors.pin}</p>
          : <p className="font-label-sm text-on-surface-variant mt-xs">Used for card & transaction verification</p>}
      </div>
    </div>,

    // Step 3 – Account Setup
    <div className="space-y-md" key="s3">
      <p className="font-label-md text-on-surface-variant">Choose your initial deposit ({form.currencySymbol})</p>
      <div className="flex flex-wrap gap-sm">
        {DEPOSIT_OPTS.map(amt => (
          <button key={amt} type="button"
            onClick={() => { setForm(p => ({ ...p, initialDeposit: amt, customDeposit: "" })); setFieldErrors(p => ({ ...p, deposit: "" })); }}
            className={`px-md py-xs rounded-full font-label-md border transition-all ${
              form.initialDeposit === amt && !form.customDeposit
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary"
            }`}>
            {form.currencySymbol}{amt.toLocaleString()}
          </button>
        ))}
      </div>
      <div>
        <label className="font-label-md text-label-md text-primary block mb-xs">Or enter a custom amount</label>
        <input className={`w-full px-md py-sm rounded-lg border ${fieldErrors.deposit ? "border-error" : "border-outline-variant"} font-body-sm focus:outline-none focus:border-primary`}
          type="number" value={form.customDeposit} onChange={set("customDeposit")} placeholder="Minimum 100" />
        {fieldErrors.deposit && <p className="text-error text-label-sm mt-xs">{fieldErrors.deposit}</p>}
      </div>
      {depositVal >= 100 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md space-y-sm">
          <p className="font-label-md text-primary">Account Preview</p>
          {[
            ["Name",             `${form.firstName} ${form.lastName}`],
            ["Currency",         `${form.currency} (${form.currencySymbol})`],
            ["Opening balance",  `${form.currencySymbol}${depositVal.toLocaleString()}`],
            ["Account tier",     getAccountType(depositVal)],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="font-label-sm text-on-surface-variant">{label}</span>
              <span className="font-label-md text-primary">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-gutter bg-background">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-sm mb-lg">
          <span className="material-symbols-outlined text-primary text-[32px]">account_balance</span>
          <h1 className="font-hanken text-headline-md text-primary">QuinCore Bank</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-xs mb-lg">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-surface-container-high"}`} />
          ))}
        </div>

        <h2 className="font-hanken text-headline-lg text-primary mb-xs">{STEPS[step]}</h2>
        <p className="font-label-sm text-on-surface-variant mb-lg">Step {step + 1} of {STEPS.length}</p>

        {error && <div className="mb-md p-sm bg-error-container text-on-error-container rounded-lg font-label-md text-label-md">{error}</div>}

        {stepContent[step]}

        <div className="flex gap-md mt-lg">
          {step > 0 && (
            <button onClick={back} type="button"
              className="flex-1 border border-outline-variant rounded-lg py-sm font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} type="button"
              className="flex-1 bg-primary text-on-primary rounded-lg py-sm font-label-md active:scale-95 transition-transform">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} type="button"
              className="flex-1 bg-primary text-on-primary rounded-lg py-sm font-label-md active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-sm">
              {loading
                ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Creating account…</>
                : "Create Account 🎉"}
            </button>
          )}
        </div>

        <div className="mt-md text-center font-label-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
