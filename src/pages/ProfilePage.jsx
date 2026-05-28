import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

export default function ProfilePage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);
  const [editing, setEditing]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [copied,  setCopied]      = useState(false);
  const [form, setForm] = useState({});

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
      await updateDoc(doc(db, "users", uid), {
        firstName: form.firstName, lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`,
        phone: form.phone, address: form.address,
      });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(userData.accountNumber || "").catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const initials = `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`;

  const infoFields = [
    { label: "Phone Number",        value: userData.phone },
    { label: "Date of Birth",       value: userData.dateOfBirth },
    { label: "Primary Address",     value: userData.address },
    { label: "Country",             value: userData.country },
    { label: "Currency",            value: `${userData.currency} (${userData.currencySymbol})` },
    { label: "Member Since",        value: userData.createdAt?.toDate?.()?.toLocaleDateString("en-US", { month: "long", year: "numeric" }) || "—" },
  ];

  const inputCls = "w-full px-md py-sm rounded-lg border border-outline-variant font-body-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24 md:pb-lg">
        <Header title="Member Profile" userData={userData} />
        <div className="max-w-4xl mx-auto px-gutter pb-xl space-y-lg mt-md">

          {/* Profile Header Card */}
          <div className="bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-lg">
            <div className="relative">
              <div className="h-32 w-32 rounded-full ring-4 ring-secondary-fixed bg-primary flex items-center justify-center text-on-primary text-4xl font-hanken font-bold">
                {initials}
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-on-primary px-sm py-xs rounded-full border-2 border-surface-container-lowest flex items-center gap-1 shadow-md">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-label-sm">{userData.accountType}</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-hanken text-headline-lg text-primary">{userData.fullName}</h2>
              <p className="font-body-md text-on-surface-variant">{userData.email}</p>
              <div className="mt-md flex flex-wrap justify-center md:justify-start gap-base">
                <span className="bg-secondary-container text-on-secondary-container font-label-sm px-md py-xs rounded-full">
                  {userData.country}
                </span>
                <span className="bg-surface-container-high text-on-surface-variant font-label-sm px-md py-xs rounded-full">
                  Verified Identity
                </span>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="font-hanken text-headline-md text-primary">Personal Details</h3>
              {!editing && (
                <button onClick={startEdit}
                  className="flex items-center gap-xs text-primary font-label-md hover:underline active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                </button>
              )}
            </div>
            <div className="p-lg">
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div><label className="font-label-sm text-on-primary-container block mb-xs">First Name</label><input className={inputCls} value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} /></div>
                  <div><label className="font-label-sm text-on-primary-container block mb-xs">Last Name</label><input className={inputCls} value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></div>
                  <div><label className="font-label-sm text-on-primary-container block mb-xs">Phone Number</label><input className={inputCls} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><label className="font-label-sm text-on-primary-container block mb-xs">Address</label><input className={inputCls} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
                  <div className="md:col-span-2 flex gap-md pt-sm">
                    <button onClick={() => setEditing(false)} className="flex-1 border border-outline-variant py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-md active:scale-95 disabled:opacity-60 flex items-center justify-center gap-sm">
                      {saving ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Saving…</> : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-xl gap-y-lg">
                  {infoFields.map(({ label, value }) => (
                    <div key={label} className="space-y-xs">
                      <label className="font-label-sm text-on-primary-container">{label}</label>
                      <p className="font-body-md text-on-surface">{value || "—"}</p>
                    </div>
                  ))}
                  {/* Account Number — full width with copy */}
                  <div className="space-y-xs md:col-span-2">
                    <label className="font-label-sm text-on-primary-container">Account Number</label>
                    <div className="flex items-center gap-base">
                      <p className="font-body-md text-on-surface tracking-wider">{userData.accountNumber}</p>
                      <button onClick={handleCopy} className="material-symbols-outlined text-on-secondary-fixed-variant text-[18px] active:scale-95">
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
                <h3 className="font-label-md text-primary">Security Settings</h3>
                <span className="text-on-error-container bg-error-container font-label-sm px-sm py-xs rounded-lg">Action Required</span>
              </div>
              {[
                { icon: "fingerprint", title: "Biometric Login",   sub: "Currently enabled on your device",    enabled: true  },
                { icon: "shield",      title: "Two-Factor Auth",    sub: "Via SMS and Email",                   enabled: true  },
              ].map(item => (
                <div key={item.title} className={`flex items-center justify-between p-sm rounded-lg border border-outline-variant/30 ${item.enabled ? "bg-surface-container-low" : ""}`}>
                  <div className="flex items-center gap-md">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    <div>
                      <p className="font-label-md">{item.title}</p>
                      <p className="font-body-sm text-on-surface-variant">{item.sub}</p>
                    </div>
                  </div>
                  {item.enabled
                    ? <div className="w-12 h-6 bg-primary rounded-full relative p-1"><div className="w-4 h-4 bg-on-primary rounded-full ml-auto" /></div>
                    : <button className="font-label-sm text-primary hover:underline">Update</button>}
                </div>
              ))}
            </div>
            <div className="bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-between shadow-lg">
              <div className="space-y-base">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <h3 className="font-hanken text-headline-md">{userData.accountType} Support</h3>
                <p className="font-body-sm text-on-primary-container">As a {userData.accountType} member, you have dedicated support available 24/7 for all your transactions.</p>
              </div>
              <button className="mt-lg w-full bg-on-primary text-primary font-label-md py-base rounded-lg active:scale-95 transition-transform">
                Contact Support
              </button>
            </div>
          </div>

          {/* Edit Button (non-editing state) */}
          {!editing && (
            <div className="flex justify-end pt-md">
              <button onClick={startEdit}
                className="bg-primary text-on-primary font-label-md px-xl py-md rounded-xl hover:opacity-90 transition-opacity active:scale-95 flex items-center gap-base">
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Edit Profile
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
