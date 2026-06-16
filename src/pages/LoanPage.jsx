import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

const STEPS = [
  "Loan Request",
  "Personal Info",
  "Contact Details",
  "Employment & Income",
  "ID & Documents",
  "Next of Kin",
  "Review & Submit",
];

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const inputCls = (err) =>
  `w-full px-3 py-3 rounded-lg border ${err ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm transition-colors`;

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

function FileUpload({ label, required, value, onChange, error }) {
  return (
    <div>
      <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div
        className={`border-2 border-dashed ${error ? "border-error" : "border-outline-variant"} rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors`}
        onClick={() => document.getElementById(`file-${label.replace(/\s/g,"-")}`).click()}>
        <input
          id={`file-${label.replace(/\s/g,"-")}`}
          type="file" accept="image/*,.pdf" className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) { const b64 = await toBase64(file); onChange(b64, file.name); }
          }} />
        {value ? (
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            <span className="text-xs font-bold text-green-600">File uploaded ✓</span>
          </div>
        ) : (
          <div>
            <span className="material-symbols-outlined text-on-surface-variant text-[32px]">upload_file</span>
            <p className="text-xs text-on-surface-variant mt-1">Tap to upload</p>
            <p className="text-[10px] text-on-surface-variant">JPG, PNG or PDF</p>
          </div>
        )}
      </div>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function LoanPage() {
  const navigate   = useNavigate();
  const uid        = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);
  const [step,     setStep]     = useState(0);
  const [errors,   setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [pinInput,   setPinInput]   = useState("");
  const [pinError,   setPinError]   = useState("");

  const [form, setForm] = useState({
    // Step 0 — Loan Request
    loanAmount: "", loanPurpose: "", repaymentPeriod: "", loanDescription: "",
    // Step 1 — Personal Info
    gender: "", maritalStatus: "", dependants: "", ssn: "",
    city: "", state: "", zipCode: "", timeAtAddress: "",
    // Step 2 — Contact
    mailingAddress: "", preferredContact: "",
    // Step 3 — Employment
    employmentStatus: "", employerName: "", jobTitle: "", workAddress: "",
    monthlyIncome: "", otherIncome: "", monthlyExpenses: "", existingLoans: "", existingLoanAmount: "",
    // Step 4 — Documents
    idType: "", idNumber: "", idExpiry: "",
    idFront: "", idBack: "", selfieWithId: "", proofOfAddress: "", proofOfIncome: "",
    idFrontName: "", idBackName: "", selfieName: "", proofAddressName: "", proofIncomeName: "",
    // Step 5 — Next of Kin
    kinName: "", kinRelationship: "", kinPhone: "", kinEmail: "", kinAddress: "",
  });

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!form.loanAmount || isNaN(form.loanAmount) || parseFloat(form.loanAmount) < 100) e.loanAmount = "Minimum loan is 100";
      if (!form.loanPurpose)      e.loanPurpose      = "Required";
      if (!form.repaymentPeriod)  e.repaymentPeriod  = "Required";
      if (!form.loanDescription.trim()) e.loanDescription = "Required";
    }
    if (step === 1) {
      if (!form.gender)        e.gender        = "Required";
      if (!form.maritalStatus) e.maritalStatus = "Required";
      if (!form.ssn.trim())    e.ssn           = "Required";
      if (!form.city.trim())   e.city          = "Required";
      if (!form.state.trim())  e.state         = "Required";
      if (!form.zipCode.trim()) e.zipCode       = "Required";
    }
    if (step === 2) {
      if (!form.preferredContact) e.preferredContact = "Required";
    }
    if (step === 3) {
      if (!form.employmentStatus) e.employmentStatus = "Required";
      if (!form.monthlyIncome || isNaN(form.monthlyIncome)) e.monthlyIncome = "Required";
      if (!form.monthlyExpenses || isNaN(form.monthlyExpenses)) e.monthlyExpenses = "Required";
    }
    if (step === 4) {
      if (!form.idType)    e.idType    = "Required";
      if (!form.idNumber.trim()) e.idNumber = "Required";
      if (!form.idExpiry)  e.idExpiry  = "Required";
      if (!form.idFront)   e.idFront   = "Please upload ID front";
      if (!form.idBack)    e.idBack    = "Please upload ID back";
      if (!form.selfieWithId) e.selfieWithId = "Please upload selfie with ID";
    }
    if (step === 5) {
      if (!form.kinName.trim())         e.kinName         = "Required";
      if (!form.kinRelationship)        e.kinRelationship = "Required";
      if (!form.kinPhone.trim())        e.kinPhone        = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const monthlyPayment = () => {
    const amount  = parseFloat(form.loanAmount) || 0;
    const months  = parseInt(form.repaymentPeriod) || 1;
    const rate    = 0.05 / 12; // 5% annual interest
    if (amount === 0) return "0.00";
    const payment = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return payment.toFixed(2);
  };

  const handleSubmit = async () => {
    if (pinInput !== userData.pin) { setPinError("Incorrect PIN."); setPinInput(""); return; }
    setSubmitting(true);
    try {
      const loanApplication = {
        id:          `LOAN${Date.now()}`,
        status:      "Pending",
        submittedAt: new Date().toISOString(),
        userId:      uid,
        userEmail:   userData.email,
        userName:    userData.fullName,
        userAccount: userData.accountNumber,
        // Loan details
        loanAmount:       parseFloat(form.loanAmount),
        loanPurpose:      form.loanPurpose,
        repaymentPeriod:  form.repaymentPeriod,
        loanDescription:  form.loanDescription,
        monthlyPayment:   monthlyPayment(),
        // Personal
        gender:          form.gender,
        maritalStatus:   form.maritalStatus,
        dependants:      form.dependants,
        ssn:             form.ssn,
        city:            form.city,
        state:           form.state,
        zipCode:         form.zipCode,
        timeAtAddress:   form.timeAtAddress,
        // Contact
        phone:           userData.phone,
        email:           userData.email,
        mailingAddress:  form.mailingAddress || userData.address,
        preferredContact: form.preferredContact,
        // Employment
        employmentStatus: form.employmentStatus,
        employerName:    form.employerName,
        jobTitle:        form.jobTitle,
        workAddress:     form.workAddress,
        monthlyIncome:   parseFloat(form.monthlyIncome),
        otherIncome:     form.otherIncome,
        monthlyExpenses: parseFloat(form.monthlyExpenses),
        existingLoans:   form.existingLoans,
        existingLoanAmount: form.existingLoanAmount,
        // Documents
        idType:    form.idType,
        idNumber:  form.idNumber,
        idExpiry:  form.idExpiry,
        idFront:   form.idFront,
        idBack:    form.idBack,
        selfieWithId:    form.selfieWithId,
        proofOfAddress:  form.proofOfAddress,
        proofOfIncome:   form.proofOfIncome,
        // Next of kin
        kinName:         form.kinName,
        kinRelationship: form.kinRelationship,
        kinPhone:        form.kinPhone,
        kinEmail:        form.kinEmail,
        kinAddress:      form.kinAddress,
        // Currency
        currency:       userData.currency,
        currencySymbol: userData.currencySymbol,
      };

      await updateDoc(doc(db, "users", uid), {
        loanApplications: arrayUnion(loanApplication),
      });
      setSubmitted(true);
    } catch (e) { setPinError(e.message); }
    finally { setSubmitting(false); }
  };

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );

  const sym = userData.currencySymbol || "$";

  if (submitted) return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Loan Application" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-hanken text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
          <p className="text-sm text-on-surface-variant mb-6">Your loan application has been received. Our team will review it and get back to you within 2-3 business days.</p>
          <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-2 mb-6">
            {[
              ["Amount Requested", `${sym}${parseFloat(form.loanAmount).toLocaleString()}`],
              ["Purpose",          form.loanPurpose],
              ["Repayment",        `${form.repaymentPeriod} months`],
              ["Monthly Payment",  `${sym}${monthlyPayment()}`],
              ["Status",           "⏳ Pending Review"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-on-surface-variant">{label}</span>
                <span className="text-xs font-bold text-primary">{val}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/profile")}
            className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95">
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );

  const stepContent = [
    // ── Step 0 — Loan Request ─────────────────────────────────────────────────
    <div className="space-y-4" key="s0">
      <Field label="Loan Amount" required error={errors.loanAmount}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">{sym}</span>
          <input className={`${inputCls(errors.loanAmount)} pl-7`} type="number" placeholder="0.00" value={form.loanAmount} onChange={set("loanAmount")} />
        </div>
      </Field>
      <Field label="Loan Purpose" required error={errors.loanPurpose}>
        <select className={inputCls(errors.loanPurpose)} value={form.loanPurpose} onChange={set("loanPurpose")}>
          <option value="">Select purpose</option>
          {["Business", "Personal", "Education", "Medical", "Emergency", "Home Improvement", "Car Purchase", "Debt Consolidation", "Travel", "Other"].map(p => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Repayment Period" required error={errors.repaymentPeriod}>
        <select className={inputCls(errors.repaymentPeriod)} value={form.repaymentPeriod} onChange={set("repaymentPeriod")}>
          <option value="">Select period</option>
          {["3", "6", "12", "18", "24", "36"].map(m => <option key={m} value={m}>{m} months</option>)}
        </select>
      </Field>
      <Field label="Why do you need this loan?" required error={errors.loanDescription}>
        <textarea className={`${inputCls(errors.loanDescription)} resize-none`} rows={4}
          placeholder="Briefly explain how you plan to use this loan..."
          value={form.loanDescription} onChange={set("loanDescription")} />
      </Field>
      {form.loanAmount && form.repaymentPeriod && (
        <div className="bg-primary-container rounded-xl p-4 text-on-primary">
          <p className="text-xs text-on-primary-container uppercase tracking-wider mb-2">Loan Estimate</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Loan Amount", `${sym}${parseFloat(form.loanAmount).toLocaleString()}`],
              ["Monthly Payment", `${sym}${monthlyPayment()}`],
              ["Repayment Period", `${form.repaymentPeriod} months`],
              ["Interest Rate", "5% p.a."],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] text-on-primary-container">{label}</p>
                <p className="text-sm font-bold">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>,

    // ── Step 1 — Personal Info ────────────────────────────────────────────────
    <div className="space-y-4" key="s1">
      <div className="bg-secondary-container p-3 rounded-lg">
        <p className="text-xs font-bold text-on-secondary-container">Auto-filled from your profile</p>
        <p className="text-xs text-on-secondary-container mt-0.5">{userData.fullName} • {userData.dateOfBirth} • {userData.address}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Gender" required error={errors.gender}>
          <select className={inputCls(errors.gender)} value={form.gender} onChange={set("gender")}>
            <option value="">Select</option>
            {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Marital Status" required error={errors.maritalStatus}>
          <select className={inputCls(errors.maritalStatus)} value={form.maritalStatus} onChange={set("maritalStatus")}>
            <option value="">Select</option>
            {["Single", "Married", "Divorced", "Widowed", "Separated"].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="No. of Dependants" error={errors.dependants}>
          <input className={inputCls(errors.dependants)} type="number" placeholder="0" value={form.dependants} onChange={set("dependants")} />
        </Field>
        <Field label="SSN" required error={errors.ssn}>
          <input className={inputCls(errors.ssn)} placeholder="XXX-XX-XXXX" value={form.ssn} onChange={set("ssn")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" required error={errors.city}>
          <input className={inputCls(errors.city)} placeholder="City" value={form.city} onChange={set("city")} />
        </Field>
        <Field label="State" required error={errors.state}>
          <input className={inputCls(errors.state)} placeholder="State" value={form.state} onChange={set("state")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Zip / Postal Code" required error={errors.zipCode}>
          <input className={inputCls(errors.zipCode)} placeholder="00000" value={form.zipCode} onChange={set("zipCode")} />
        </Field>
        <Field label="Time at Address" error={errors.timeAtAddress}>
          <select className={inputCls(errors.timeAtAddress)} value={form.timeAtAddress} onChange={set("timeAtAddress")}>
            <option value="">Select</option>
            {["Less than 1 year", "1-2 years", "3-5 years", "5-10 years", "10+ years"].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
      </div>
    </div>,

    // ── Step 2 — Contact Details ──────────────────────────────────────────────
    <div className="space-y-4" key="s2">
      <div className="bg-secondary-container p-3 rounded-lg">
        <p className="text-xs font-bold text-on-secondary-container">Auto-filled contact info</p>
        <p className="text-xs text-on-secondary-container mt-0.5">{userData.email} • {userData.phone}</p>
      </div>
      <Field label="Mailing Address (if different from residential)" error={errors.mailingAddress}>
        <input className={inputCls(errors.mailingAddress)} placeholder="Leave blank if same as residential"
          value={form.mailingAddress} onChange={set("mailingAddress")} />
      </Field>
      <Field label="Preferred Contact Method" required error={errors.preferredContact}>
        <div className="flex gap-2">
          {[["Phone","call"],["Email","mail"],["WhatsApp","chat"]].map(([val, icon]) => (
            <button key={val} type="button"
              onClick={() => { setForm(p => ({ ...p, preferredContact: val })); setErrors(p => ({ ...p, preferredContact: "" })); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${form.preferredContact === val ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant"}`}>
              <span className="material-symbols-outlined text-[16px]">{icon}</span>{val}
            </button>
          ))}
        </div>
        {errors.preferredContact && <p className="text-error text-xs mt-1">{errors.preferredContact}</p>}
      </Field>
    </div>,

    // ── Step 3 — Employment & Income ──────────────────────────────────────────
    <div className="space-y-4" key="s3">
      <Field label="Employment Status" required error={errors.employmentStatus}>
        <select className={inputCls(errors.employmentStatus)} value={form.employmentStatus} onChange={set("employmentStatus")}>
          <option value="">Select</option>
          {["Employed Full-time", "Employed Part-time", "Self-Employed", "Business Owner", "Student", "Retired", "Unemployed"].map(e => <option key={e}>{e}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Employer / Business Name" error={errors.employerName}>
          <input className={inputCls(errors.employerName)} placeholder="Company name" value={form.employerName} onChange={set("employerName")} />
        </Field>
        <Field label="Job Title / Position" error={errors.jobTitle}>
          <input className={inputCls(errors.jobTitle)} placeholder="Your role" value={form.jobTitle} onChange={set("jobTitle")} />
        </Field>
      </div>
      <Field label="Work Address" error={errors.workAddress}>
        <input className={inputCls(errors.workAddress)} placeholder="Office / Business address" value={form.workAddress} onChange={set("workAddress")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Monthly Income (${sym})`} required error={errors.monthlyIncome}>
          <input className={inputCls(errors.monthlyIncome)} type="number" placeholder="0.00" value={form.monthlyIncome} onChange={set("monthlyIncome")} />
        </Field>
        <Field label={`Other Income (${sym})`} error={errors.otherIncome}>
          <input className={inputCls(errors.otherIncome)} type="number" placeholder="0.00" value={form.otherIncome} onChange={set("otherIncome")} />
        </Field>
      </div>
      <Field label={`Monthly Expenses (${sym})`} required error={errors.monthlyExpenses}>
        <input className={inputCls(errors.monthlyExpenses)} type="number" placeholder="0.00" value={form.monthlyExpenses} onChange={set("monthlyExpenses")} />
      </Field>
      <Field label="Do you have any existing loans?" error={errors.existingLoans}>
        <div className="flex gap-2">
          {["Yes", "No"].map(v => (
            <button key={v} type="button"
              onClick={() => setForm(p => ({ ...p, existingLoans: v }))}
              className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${form.existingLoans === v ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant"}`}>
              {v}
            </button>
          ))}
        </div>
      </Field>
      {form.existingLoans === "Yes" && (
        <Field label={`Total Existing Loan Amount (${sym})`} error={errors.existingLoanAmount}>
          <input className={inputCls(errors.existingLoanAmount)} type="number" placeholder="0.00" value={form.existingLoanAmount} onChange={set("existingLoanAmount")} />
        </Field>
      )}
    </div>,

    // ── Step 4 — ID & Documents ───────────────────────────────────────────────
    <div className="space-y-4" key="s4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="ID Type" required error={errors.idType}>
          <select className={inputCls(errors.idType)} value={form.idType} onChange={set("idType")}>
            <option value="">Select</option>
            {["National ID", "Passport", "Driver's License", "Voter's Card", "Residence Permit"].map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="ID Number" required error={errors.idNumber}>
          <input className={inputCls(errors.idNumber)} placeholder="ID number" value={form.idNumber} onChange={set("idNumber")} />
        </Field>
      </div>
      <Field label="ID Expiry Date" required error={errors.idExpiry}>
        <input className={`${inputCls(errors.idExpiry)} box-border`} type="date" value={form.idExpiry} onChange={set("idExpiry")} style={{ colorScheme: "light" }} />
      </Field>
      <FileUpload label="ID Card Front" required value={form.idFront} error={errors.idFront}
        onChange={(b64) => { setForm(p => ({ ...p, idFront: b64 })); setErrors(p => ({ ...p, idFront: "" })); }} />
      <FileUpload label="ID Card Back" required value={form.idBack} error={errors.idBack}
        onChange={(b64) => { setForm(p => ({ ...p, idBack: b64 })); setErrors(p => ({ ...p, idBack: "" })); }} />
      <FileUpload label="Selfie Holding ID" required value={form.selfieWithId} error={errors.selfieWithId}
        onChange={(b64) => { setForm(p => ({ ...p, selfieWithId: b64 })); setErrors(p => ({ ...p, selfieWithId: "" })); }} />
      <FileUpload label="Proof of Address (Utility Bill / Bank Statement)" value={form.proofOfAddress} error={errors.proofOfAddress}
        onChange={(b64) => setForm(p => ({ ...p, proofOfAddress: b64 }))} />
      <FileUpload label="Proof of Income (Payslip)" value={form.proofOfIncome} error={errors.proofOfIncome}
        onChange={(b64) => setForm(p => ({ ...p, proofOfIncome: b64 }))} />
    </div>,

    // ── Step 5 — Next of Kin ──────────────────────────────────────────────────
    <div className="space-y-4" key="s5">
      <Field label="Full Name" required error={errors.kinName}>
        <input className={inputCls(errors.kinName)} placeholder="Next of kin full name" value={form.kinName} onChange={set("kinName")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Relationship" required error={errors.kinRelationship}>
          <select className={inputCls(errors.kinRelationship)} value={form.kinRelationship} onChange={set("kinRelationship")}>
            <option value="">Select</option>
            {["Parent", "Spouse", "Sibling", "Child", "Friend", "Colleague", "Other"].map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Phone Number" required error={errors.kinPhone}>
          <input className={inputCls(errors.kinPhone)} placeholder="+1 (555) 000-0000" value={form.kinPhone} onChange={set("kinPhone")} />
        </Field>
      </div>
      <Field label="Email Address" error={errors.kinEmail}>
        <input className={inputCls(errors.kinEmail)} type="email" placeholder="kin@email.com" value={form.kinEmail} onChange={set("kinEmail")} />
      </Field>
      <Field label="Address" error={errors.kinAddress}>
        <input className={inputCls(errors.kinAddress)} placeholder="Next of kin address" value={form.kinAddress} onChange={set("kinAddress")} />
      </Field>
    </div>,

    // ── Step 6 — Review & Submit ──────────────────────────────────────────────
    <div className="space-y-4" key="s6">
      {/* Loan Summary */}
      <div className="bg-primary-container rounded-xl p-4 text-on-primary">
        <p className="text-xs font-bold text-on-primary-container uppercase tracking-wider mb-3">Loan Summary</p>
        {[
          ["Amount", `${sym}${parseFloat(form.loanAmount).toLocaleString()}`],
          ["Purpose", form.loanPurpose],
          ["Period", `${form.repaymentPeriod} months`],
          ["Monthly Payment", `${sym}${monthlyPayment()}`],
          ["Interest Rate", "5% p.a."],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between py-1 border-b border-on-primary/10 last:border-0">
            <span className="text-xs text-on-primary-container">{label}</span>
            <span className="text-xs font-bold">{val}</span>
          </div>
        ))}
      </div>

      {/* Personal Summary */}
      <div className="bg-surface-container-low rounded-xl p-4 space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Personal Details</p>
        {[
          ["Name", userData.fullName],
          ["SSN", form.ssn],
          ["Gender", form.gender],
          ["Marital Status", form.maritalStatus],
          ["Employment", form.employmentStatus],
          ["Monthly Income", `${sym}${parseFloat(form.monthlyIncome || 0).toLocaleString()}`],
          ["Next of Kin", `${form.kinName} (${form.kinRelationship})`],
          ["Documents", [form.idFront, form.idBack, form.selfieWithId].filter(Boolean).length + "/3 uploaded"],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between">
            <span className="text-xs text-on-surface-variant">{label}</span>
            <span className="text-xs font-bold text-primary text-right max-w-[55%]">{val}</span>
          </div>
        ))}
      </div>

      {/* PIN Verification */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold text-primary text-center">Enter your PIN to submit</p>
        {pinError && <p className="text-error text-xs text-center font-semibold">{pinError}</p>}
        <div className="flex justify-center gap-2">
          {Array.from({ length: userData.pin?.length || 4 }).map((_, i) => (
            <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${pinInput[i] ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-low"}`}>
              {pinInput[i] ? "•" : ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((key, i) => (
            <button key={i} type="button"
              onClick={() => {
                if (key === "⌫") { setPinInput(p => p.slice(0,-1)); setPinError(""); }
                else if (key !== "" && pinInput.length < (userData.pin?.length || 4)) { setPinInput(p => p + String(key)); }
              }}
              className={`h-12 rounded-xl text-base font-bold transition-all active:scale-95 ${key === "" ? "invisible" : key === "⌫" ? "bg-error-container text-on-error-container" : "bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant"}`}>
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Loan Application" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Progress */}
          <div className="flex gap-1 mb-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-surface-container-high"}`} />
            ))}
          </div>
          <h2 className="font-hanken text-xl font-bold text-primary mb-0.5">{STEPS[step]}</h2>
          <p className="text-xs text-on-surface-variant mb-5">Step {step + 1} of {STEPS.length}</p>

          {stepContent[step]}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={back} type="button"
                className="flex-1 border border-outline-variant rounded-lg py-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={next} type="button"
                className="flex-1 bg-primary text-on-primary rounded-lg py-3 text-xs font-bold active:scale-95">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || pinInput.length < (userData.pin?.length || 4)} type="button"
                className="flex-1 bg-primary text-on-primary rounded-lg py-3 text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Submitting…</> : "Submit Application 🏦"}
              </button>
            )}
          </div>

          {step === 0 && (
            <button onClick={() => navigate("/profile")} type="button"
              className="w-full mt-3 text-xs text-on-surface-variant text-center hover:underline">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}