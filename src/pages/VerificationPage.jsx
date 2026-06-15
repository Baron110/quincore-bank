import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function FileUpload({ label, required, value, onChange, error }) {
  const id = `vfile-${label.replace(/\s/g, "-")}`;
  return (
    <div>
      <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div
        className={`border-2 border-dashed ${error ? "border-error" : value ? "border-green-500" : "border-outline-variant"} rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors`}
        onClick={() => document.getElementById(id).click()}>
        <input id={id} type="file" accept="image/*" className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) { const b64 = await toBase64(file); onChange(b64); }
          }} />
        {value ? (
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
          </div>
        ) : (
          <div>
            <span className="material-symbols-outlined text-on-surface-variant text-[32px]">upload_file</span>
            <p className="text-xs text-on-surface-variant mt-1">Tap to upload photo</p>
          </div>
        )}
      </div>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function VerificationPage() {
  const navigate = useNavigate();
  const uid      = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);

  const [form,      setForm]      = useState({ idType: "", idNumber: "", legalName: "" });
  const [idPhoto,   setIdPhoto]   = useState("");
  const [selfie,    setSelfie]    = useState("");
  const [errors,    setErrors]    = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.legalName.trim()) e.legalName = "Required";
    if (!form.idType)           e.idType    = "Required";
    if (!form.idNumber.trim())  e.idNumber  = "Required";
    if (!idPhoto)               e.idPhoto   = "Please upload your ID photo";
    if (!selfie)                e.selfie    = "Please upload a selfie with your ID";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        verificationRequest: {
          status:      "Pending",
          submittedAt: new Date().toISOString(),
          legalName:   form.legalName.trim(),
          idType:      form.idType,
          idNumber:    form.idNumber.trim(),
          dateOfBirth: userData.dateOfBirth,
          country:     userData.country,
          idPhoto,
          selfie,
        },
      });
      setSubmitted(true);
    } catch (e) { setErrors({ submit: e.message }); }
    finally { setSubmitting(false); }
  };

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );

  const inputCls = (field) =>
    `w-full px-3 py-3 rounded-lg border ${errors[field] ? "border-error" : "border-outline-variant"} focus:outline-none focus:border-primary bg-white text-sm`;

  // Already verified
  if (userData.verified) return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Account Verification" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-blue-600 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <h2 className="font-hanken text-2xl font-bold text-primary mb-2">Account Verified ✓</h2>
          <p className="text-sm text-on-surface-variant mb-6">Your account has been verified. Your verification badge is now visible on your profile.</p>
          <button onClick={() => navigate("/profile")}
            className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95">
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );

  // Pending request
  if (userData.verificationRequest?.status === "Pending" && !submitted) return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Account Verification" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-amber-600 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
          </div>
          <h2 className="font-hanken text-2xl font-bold text-primary mb-2">Request Pending</h2>
          <p className="text-sm text-on-surface-variant mb-6">Your verification request has been submitted and is under review. We'll notify you within 2-3 business days.</p>
          <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-2 mb-6">
            {[
              ["Submitted", new Date(userData.verificationRequest.submittedAt).toLocaleDateString()],
              ["ID Type",   userData.verificationRequest.idType],
              ["Status",    "⏳ Under Review"],
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

  // Submitted success
  if (submitted) return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Account Verification" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-hanken text-2xl font-bold text-primary mb-2">Request Submitted!</h2>
          <p className="text-sm text-on-surface-variant mb-6">Your verification request has been received. Our team will review your documents and respond within 2-3 business days.</p>
          <button onClick={() => navigate("/profile")}
            className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95">
            Back to Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Account Verification" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* Hero */}
          <div className="bg-primary-container rounded-xl p-6 text-on-primary flex items-center gap-4">
            <div className="w-14 h-14 bg-secondary-fixed rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <h2 className="font-hanken text-lg font-bold">Get Verified</h2>
              <p className="text-xs text-on-primary-container mt-1">Submit your ID documents to receive a verified badge on your QuinCore account.</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ["verified", "Verified Badge"],
              ["security", "More Trust"],
              ["lock_open", "Higher Limits"],
            ].map(([icon, label]) => (
              <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
                <span className="material-symbols-outlined text-primary text-[24px]">{icon}</span>
                <p className="text-[10px] font-bold text-primary mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-4">
            <h3 className="font-hanken text-lg font-bold text-primary">Verification Details</h3>

            {/* Auto-filled info */}
            <div className="bg-secondary-container p-3 rounded-lg space-y-1">
              <p className="text-xs font-bold text-on-secondary-container">Auto-filled from your profile</p>
              <p className="text-xs text-on-secondary-container">{userData.fullName} • {userData.dateOfBirth} • {userData.country}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">
                Full Legal Name <span className="text-error">*</span>
              </label>
              <input className={inputCls("legalName")} placeholder="As it appears on your ID"
                value={form.legalName} onChange={set("legalName")} />
              {errors.legalName && <p className="text-error text-xs mt-1">{errors.legalName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">
                  ID Type <span className="text-error">*</span>
                </label>
                <select className={inputCls("idType")} value={form.idType} onChange={set("idType")}>
                  <option value="">Select</option>
                  {["National ID", "Passport", "Driver's License", "Voter's Card", "Residence Permit"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                {errors.idType && <p className="text-error text-xs mt-1">{errors.idType}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">
                  ID Number <span className="text-error">*</span>
                </label>
                <input className={inputCls("idNumber")} placeholder="ID number"
                  value={form.idNumber} onChange={set("idNumber")} />
                {errors.idNumber && <p className="text-error text-xs mt-1">{errors.idNumber}</p>}
              </div>
            </div>

            <FileUpload label="ID Card / Passport Photo" required value={idPhoto} error={errors.idPhoto}
              onChange={(b64) => { setIdPhoto(b64); setErrors(p => ({ ...p, idPhoto: "" })); }} />

            <FileUpload label="Selfie Holding Your ID" required value={selfie} error={errors.selfie}
              onChange={(b64) => { setSelfie(b64); setErrors(p => ({ ...p, selfie: "" })); }} />

            {errors.submit && <p className="text-error text-xs font-semibold">{errors.submit}</p>}

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting
                ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Submitting…</>
                : "Submit Verification Request"}
            </button>
          </div>

          <p className="text-[10px] text-center text-on-surface-variant">
            Your documents are encrypted and stored securely. QuinCore will never share your information with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}