import React, { useState, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import { useNavigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

export default function ProfilePage() {
  const uid        = auth.currentUser?.uid;
  const navigate   = useNavigate();
  const { userData, loading } = useUserData(uid);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [form,     setForm]     = useState({});
  const fileRef = useRef();

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const startEdit = () => {
    setForm({ firstName: userData.firstName, lastName: userData.lastName, phone: userData.phone, address: userData.address });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        firstName: form.firstName, lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`,
        phone: form.phone, address: form.address,
      };
      if (photoUrl) updates.photoUrl = photoUrl;
      await updateDoc(doc(db, "users", uid), updates);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(userData.accountNumber || "").catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Handle photo upload — convert to base64
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const displayPhoto = photoUrl || userData.photoUrl;
  const initials = `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`;

  const inputCls = "w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary transition-colors bg-white";

  const infoFields = [
    { label: "Phone Number",    value: userData.phone },
    { label: "Date of Birth",   value: userData.dateOfBirth },
    { label: "Primary Address", value: userData.address },
    { label: "Country",         value: userData.country },
    { label: "Currency",        value: `${userData.currency} (${userData.currencySymbol})` },
    { label: "Member Since",    value: userData.createdAt?.toDate?.()?.toLocaleDateString("en-US", { month: "long", year: "numeric" }) || "—" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24 md:pb-lg">
        <Header title="Member Profile" userData={userData} />
        <div className="max-w-4xl mx-auto px-gutter pb-xl space-y-lg mt-md">

          {/* Profile Header Card */}
          <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-lg">
            {/* Avatar with edit button */}
            <div className="relative flex-shrink-0">
              <div
                className="h-28 w-28 rounded-full ring-4 ring-secondary-fixed overflow-hidden bg-primary flex items-center justify-center cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-on-primary text-3xl font-bold font-hanken">{initials}</span>
                )}
              </div>
              {/* Camera overlay */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center border-2 border-surface-container-lowest shadow-md active:scale-95">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              </button>
              <input
                ref={fileRef} type="file" accept="image/*"
                className="hidden" onChange={handlePhotoChange}
              />
              {/* Tier badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-2 py-0.5 rounded-full border-2 border-surface-container-lowest flex items-center gap-1 shadow-md whitespace-nowrap">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-[10px] font-bold">{userData.accountType}</span>
              </div>
            </div>

            <div className="text-center md:text-left mt-4 md:mt-0">
              <h2 className="font-hanken text-2xl font-bold text-primary">{userData.fullName}</h2>
              <p className="text-sm text-on-surface-variant">{userData.email}</p>
              <p className="text-xs text-on-surface-variant mt-1">Tap the camera icon to change your photo</p>
              <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full">
                  {userData.country}
                </span>
                <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">
                  Verified Identity ✓
                </span>
                {userData.verified && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Verified Account
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="font-hanken text-xl font-bold text-primary">Personal Details</h3>
              {!editing && (
                <button onClick={startEdit}
                  className="flex items-center gap-1 text-primary text-xs font-bold hover:underline active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
              )}
            </div>
            <div className="p-lg">
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1 uppercase">First Name</label>
                    <input className={inputCls} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1 uppercase">Last Name</label>
                    <input className={inputCls} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1 uppercase">Phone Number</label>
                    <input className={inputCls} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant block mb-1 uppercase">Address</label>
                    <input className={inputCls} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 border border-outline-variant py-3 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                      {saving ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Saving…</> : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  {infoFields.map(({ label, value }) => (
                    <div key={label}>
                      <label className="text-xs font-bold text-on-primary-container uppercase tracking-wider">{label}</label>
                      <p className="text-sm text-on-surface mt-1">{value || "—"}</p>
                    </div>
                  ))}
                  {/* Account Number with copy */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-on-primary-container uppercase tracking-wider">Account Number</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-on-surface tracking-wider">{userData.accountNumber}</p>
                      <button onClick={handleCopy}
                        className="material-symbols-outlined text-on-secondary-fixed-variant text-[18px] active:scale-95">
                        {copied ? "check" : "content_copy"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security + Premium */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm space-y-md">
              <div className="flex justify-between items-center mb-md">
                <h3 className="text-sm font-bold text-primary">Security Settings</h3>
                <span className="text-on-error-container bg-error-container text-xs font-bold px-2 py-1 rounded-lg">Action Required</span>
              </div>
              {[
                { icon: "fingerprint", title: "Biometric Login",  sub: "Currently enabled on your device", enabled: true },
                { icon: "shield",      title: "Two-Factor Auth",  sub: "Via SMS and Email",                enabled: true },
              ].map(item => (
                <div key={item.title} className={`flex items-center justify-between p-sm rounded-lg border border-outline-variant/30 ${item.enabled ? "bg-surface-container-low" : ""}`}>
                  <div className="flex items-center gap-md">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-on-surface-variant">{item.sub}</p>
                    </div>
                  </div>
                  {item.enabled
                    ? <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer"><div className="w-4 h-4 bg-on-primary rounded-full ml-auto" /></div>
                    : <button className="text-xs font-bold text-primary hover:underline">Update</button>}
                </div>
              ))}
            </div>

            <div className="bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-between shadow-lg">
              <div className="space-y-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <h3 className="font-hanken text-xl font-bold">{userData.accountType} Support</h3>
                <p className="text-xs text-on-primary-container">As a {userData.accountType} member, you have dedicated support available 24/7.</p>
              </div>
              <button
                onClick={() => {
                  if (userData.supportType === "whatsapp" && userData.supportContact) {
                    window.open(userData.supportContact, "_blank");
                  } else if (userData.supportType === "gmail" && userData.supportContact) {
                    window.open(`mailto:${userData.supportContact}`, "_blank");
                  } else {
                    window.open("mailto:support@quincore.online", "_blank");
                  }
                }}
                className="mt-lg w-full bg-on-primary text-primary text-xs font-bold py-3 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  {userData.supportType === "whatsapp" ? "chat" : "mail"}
                </span>
                Contact Support {userData.supportType === "whatsapp" ? "(WhatsApp)" : userData.supportType === "gmail" ? "(Email)" : ""}
              </button>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-md">
            {!editing && (
              <button onClick={startEdit}
                className="flex-1 bg-primary text-on-primary text-xs font-bold px-6 py-4 rounded-xl hover:opacity-90 transition-opacity active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
              </button>
            )}
            <button onClick={handleSignOut}
              className="flex-1 border border-error text-error text-xs font-bold px-6 py-4 rounded-xl hover:bg-error-container transition-colors active:scale-95 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>

          {/* Loan Application Button */}
          <button onClick={() => navigate("/loan")}
            className="w-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold px-6 py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            Apply for a Loan
          </button>

          {/* Verification Button */}
          <button onClick={() => navigate("/verify")}
            className={`w-full text-xs font-bold px-6 py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-sm ${
              userData.verified
                ? "bg-blue-600 text-white"
                : userData.verificationRequest?.status === "Pending"
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-surface-container-lowest border border-outline-variant text-primary"
            }`}>
            <span className="material-symbols-outlined text-[18px]">
              {userData.verified ? "verified" : "pending"}
            </span>
            {userData.verified ? "Account Verified ✓" : userData.verificationRequest?.status === "Pending" ? "Verification Pending…" : "Request Verification"}
          </button>

          {/* Cheque Generator Button */}
          <button onClick={() => navigate("/cheque")}
            className="w-full bg-surface-container-lowest border border-outline-variant text-primary text-xs font-bold px-6 py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Generate Bank Cheque
          </button>

          {/* Existing Loan Applications */}
          {(userData.loanApplications || []).length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                <h3 className="text-sm font-bold text-primary">My Loan Applications</h3>
              </div>
              <div className="p-4 space-y-3">
                {[...(userData.loanApplications || [])].reverse().map((loan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                    <div>
                      <p className="text-xs font-bold text-primary">{loan.loanPurpose} Loan</p>
                      <p className="text-[10px] text-on-surface-variant">{userData.currencySymbol}{loan.loanAmount?.toLocaleString()} · {loan.repaymentPeriod} months</p>
                      <p className="text-[10px] text-on-surface-variant">{new Date(loan.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      loan.status === "Approved" ? "bg-green-100 text-green-700" :
                      loan.status === "Rejected" ? "bg-error-container text-on-error-container" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}