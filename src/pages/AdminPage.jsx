import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";

const ADMIN_EMAIL    = "admin@quincore.online";
const ADMIN_PASSWORD = "QuinCore@Admin2026";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n, sym = "$") =>
  `${sym}${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function generateFakeTransactions(balance) {
  const debitTemplates = [
    { desc: "Netflix Subscription",  cat: "Entertainment", icon: "subscriptions",    color: "bg-error-container",        min: 10,  max: 20   },
    { desc: "Walmart Grocery Store", cat: "Shopping",      icon: "shopping_cart",    color: "bg-secondary-container",    min: 40,  max: 200  },
    { desc: "Amazon Purchase",       cat: "Shopping",      icon: "shopping_bag",     color: "bg-secondary-container",    min: 25,  max: 300  },
    { desc: "Electricity Bill",      cat: "Bills",         icon: "bolt",             color: "bg-tertiary-fixed",         min: 60,  max: 150  },
    { desc: "Internet - Fiber",      cat: "Bills",         icon: "wifi",             color: "bg-tertiary-fixed",         min: 40,  max: 80   },
    { desc: "Uber Ride",             cat: "Transport",     icon: "directions_car",   color: "bg-surface-container-high", min: 8,   max: 40   },
    { desc: "Starbucks Coffee",      cat: "Food & Drink",  icon: "coffee",           color: "bg-tertiary-fixed-dim",     min: 5,   max: 20   },
    { desc: "McDonald's",            cat: "Food & Drink",  icon: "restaurant",       color: "bg-tertiary-fixed-dim",     min: 8,   max: 30   },
    { desc: "Apple Store Purchase",  cat: "Shopping",      icon: "phone_iphone",     color: "bg-secondary-container",    min: 50,  max: 500  },
    { desc: "Spotify Premium",       cat: "Entertainment", icon: "music_note",       color: "bg-error-container",        min: 9,   max: 15   },
    { desc: "Water Bill",            cat: "Bills",         icon: "water_drop",       color: "bg-tertiary-fixed",         min: 20,  max: 60   },
    { desc: "Gas Station",           cat: "Transport",     icon: "local_gas_station",color: "bg-surface-container-high", min: 30,  max: 80   },
    { desc: "Rent Payment",          cat: "Housing",       icon: "home",             color: "bg-primary-fixed",          min: 500, max: 2000 },
    { desc: "Gym Membership",        cat: "Health",        icon: "fitness_center",   color: "bg-secondary-fixed-dim",    min: 20,  max: 60   },
    { desc: "Online Transfer Out",   cat: "Transfer",      icon: "send",             color: "bg-error-container",        min: 50,  max: 500  },
  ];
  const creditTemplates = [
    { desc: "Salary Deposit",         cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 2000, max: 8000 },
    { desc: "Freelance Payment",      cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 200,  max: 2000 },
    { desc: "Bank Transfer Received", cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,  max: 3000 },
    { desc: "Refund - Amazon",        cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 10,   max: 200  },
    { desc: "Bonus Payment",          cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 100,  max: 1000 },
  ];
  const count = Math.floor(Math.random() * 11) + 10;
  const transactions = [];
  let runningBalance = balance;
  for (let i = 0; i < count; i++) {
    const isCredit  = Math.random() > 0.55;
    const templates = isCredit ? creditTemplates : debitTemplates;
    const template  = templates[Math.floor(Math.random() * templates.length)];
    const amount    = Math.round((Math.random() * (template.max - template.min) + template.min) * 100) / 100;
    if (!isCredit && amount > runningBalance * 0.8) continue;
    runningBalance = isCredit ? runningBalance + amount : runningBalance - amount;
    const daysAgo = Math.floor(Math.random() * 55) + 1;
    const txDate  = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    transactions.push({
      id: `TXN${Date.now()}${i}${Math.floor(Math.random()*9999)}`,
      type: isCredit ? "received" : "sent", amount,
      description: template.desc,
      date: txDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: `${String(Math.floor(Math.random()*12)+1).padStart(2,"0")}:${String(Math.floor(Math.random()*60)).padStart(2,"0")}:00 ${Math.random()>0.5?"AM":"PM"}`,
      status: "Completed", category: template.cat, icon: template.icon, color: template.color,
    });
  }
  return transactions;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = "bg-primary-fixed" }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider truncate">{label}</p>
        <p className="font-hanken text-base font-bold text-primary mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function UserModal({ user, onClose, onUpdate }) {
  const [tab,            setTab]            = useState("overview");
  const [saving,         setSaving]         = useState(false);
  const [fundAmount,     setFundAmount]      = useState("");
  const [newBalance,     setNewBalance]      = useState(String(user.balance || 0));
  const [newPin,         setNewPin]          = useState("");
  const [billingMode,    setBillingMode]     = useState(user.billingMode || false);
  const [billingMessage, setBillingMessage]  = useState(user.billingMessage || "");
  const [supportType,    setSupportType]     = useState(user.supportType || "");
  const [supportContact, setSupportContact]  = useState(user.supportContact || "");
  const [successMsg,     setSuccessMsg]      = useState("");
  const [errorMsg,       setErrorMsg]        = useState("");

  const save = async (updates, msg) => {
    setSaving(true); setSuccessMsg(""); setErrorMsg("");
    try {
      await updateDoc(doc(db, "users", user.id), updates);
      setSuccessMsg(msg);
      onUpdate();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) { setErrorMsg(e.message); }
    finally { setSaving(false); }
  };

  const handleFund = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) { setErrorMsg("Enter a valid amount."); return; }
    const newBal = (user.balance || 0) + amount;
    await save({
      balance: newBal,
      transactions: arrayUnion({
        id: `ADM${Date.now()}`,
        type: "deposit",
        amount,
        description: "Admin — Account funded",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date().toLocaleTimeString(),
        status: "Completed",
        category: "Income",
        icon: "account_balance_wallet",
        color: "bg-primary-fixed",
      }),
    }, `Account funded with ${fmt(amount)}`);
    setFundAmount("");
  };

  const handleDeduct = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) { setErrorMsg("Enter a valid amount."); return; }
    if (amount > user.balance) { setErrorMsg("Amount exceeds balance."); return; }
    const newBal = (user.balance || 0) - amount;
    await save({
      balance: newBal,
      transactions: arrayUnion({
        id: `ADM${Date.now()}`,
        type: "sent",
        amount,
        description: "Admin — Balance deducted",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: new Date().toLocaleTimeString(),
        status: "Completed",
        category: "Transfer",
        icon: "remove_circle",
        color: "bg-error-container",
      }),
    }, `${fmt(amount)} deducted from account`);
    setFundAmount("");
  };

  const handleSetBalance = async () => {
    const val = parseFloat(newBalance);
    if (isNaN(val) || val < 0) { setErrorMsg("Invalid balance."); return; }
    await save({ balance: val }, `Balance set to ${fmt(val)}`);
  };

  const handleResetPin = async () => {
    if (!/^\d{4,6}$/.test(newPin)) { setErrorMsg("PIN must be 4–6 digits."); return; }
    await save({ pin: newPin }, "PIN reset successfully");
    setNewPin("");
  };

  const handleBilling = async () => {
    if (billingMode && !billingMessage.trim()) { setErrorMsg("Enter a billing message."); return; }
    await save({ billingMode, billingMessage: billingMode ? billingMessage.trim() : "" },
      billingMode ? "Billing mode enabled" : "Billing mode disabled");
  };

  const handleSupport = async () => {
    if (supportType && !supportContact.trim()) { setErrorMsg("Enter contact detail."); return; }
    await save({ supportType, supportContact: supportType ? supportContact.trim() : "" },
      supportType ? `Support set to ${supportType}` : "Support cleared");
  };

  const handleGenerateHistory = async () => {
    if (!window.confirm(`Generate 10–20 fake transactions for ${user.fullName}? This will add to existing history.`)) return;
    setSaving(true); setSuccessMsg(""); setErrorMsg("");
    try {
      const newTxns = generateFakeTransactions(user.balance || 0);
      for (const txn of newTxns) {
        await updateDoc(doc(db, "users", user.id), { transactions: arrayUnion(txn) });
      }
      setSuccessMsg(`${newTxns.length} transactions added!`);
      onUpdate();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) { setErrorMsg(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${user.fullName}'s account? This cannot be undone.`)) return;
    setSaving(true);
    try { await deleteDoc(doc(db, "users", user.id)); onUpdate(); onClose(); }
    catch (e) { setErrorMsg(e.message); setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary bg-white";
  const tabs = ["overview", "balance", "billing", "support", "security", "transactions"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-xl border border-outline-variant overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-fixed rounded-full flex items-center justify-center">
              <span className="font-bold text-primary text-sm">{user.firstName?.[0]}{user.lastName?.[0]}</span>
            </div>
            <div>
              <p className="font-hanken text-lg font-bold">{user.fullName}</p>
              <p className="text-xs text-on-primary-container">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="material-symbols-outlined active:scale-95">close</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant bg-surface-container-low overflow-x-auto flex-shrink-0">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-bold capitalize whitespace-nowrap transition-all border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">check_circle</span>{successMsg}</div>}
          {errorMsg   && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-xs font-bold">{errorMsg}</div>}

          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Account Number", user.accountNumber],
                  ["Account Tier",   user.accountType],
                  ["Occupation",     user.occupation || "—"],
                  ["Balance",        fmt(user.balance, user.currencySymbol)],
                  ["Currency",       `${user.currency} (${user.currencySymbol})`],
                  ["Country",        user.country],
                  ["Phone",          user.phone],
                  ["Date of Birth",  user.dateOfBirth],
                  ["Address",        user.address],
                  ["Invite Code",    user.inviteCode],
                  ["Transactions",   (user.transactions || []).length],
                ].map(([label, val]) => (
                  <div key={label} className="bg-surface-container-low rounded-lg p-3">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-bold text-primary mt-0.5 break-all">{val || "—"}</p>
                  </div>
                ))}
              </div>
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.billingMode ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-700"}`}>
                  {user.billingMode ? "🔒 Billing Mode ON" : "✅ Account Active"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                  {user.accountType} Tier
                </span>
              </div>
              {/* Danger zone */}
              <div className="border border-error/30 rounded-xl p-4 bg-error-container/20">
                <p className="text-xs font-bold text-error mb-3 uppercase tracking-wider">⚠️ Danger Zone</p>
                <button onClick={handleDelete} disabled={saving}
                  className="w-full py-2.5 border border-error text-error rounded-lg text-xs font-bold hover:bg-error hover:text-on-error transition-colors active:scale-95">
                  Delete Account Permanently
                </button>
              </div>
            </div>
          )}

          {/* Balance Tab */}
          {tab === "balance" && (
            <div className="space-y-4">
              <div className="bg-primary-container rounded-xl p-4 text-center">
                <p className="text-xs text-on-primary-container">Current Balance</p>
                <p className="font-hanken text-3xl font-bold text-on-primary mt-1">{fmt(user.balance, user.currencySymbol)}</p>
              </div>

              {/* Fund / Deduct */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block">Fund or Deduct</label>
                <input className={inputCls} type="number" placeholder="Enter amount" value={fundAmount} onChange={e => { setFundAmount(e.target.value); setErrorMsg(""); }} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleFund} disabled={saving}
                    className="py-2.5 bg-green-600 text-white rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">add_circle</span> Fund Account
                  </button>
                  <button onClick={handleDeduct} disabled={saving}
                    className="py-2.5 bg-error text-on-error rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">remove_circle</span> Deduct
                  </button>
                </div>
              </div>

              <div className="h-px bg-outline-variant" />

              {/* Set exact balance */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block">Set Exact Balance</label>
                <input className={inputCls} type="number" placeholder="New balance" value={newBalance} onChange={e => { setNewBalance(e.target.value); setErrorMsg(""); }} />
                <button onClick={handleSetBalance} disabled={saving}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60">
                  {saving ? "Saving…" : "Set Balance"}
                </button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {tab === "billing" && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border-2 ${billingMode ? "border-error bg-error-container/30" : "border-outline-variant bg-surface-container-low"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-primary">Billing / Restricted Mode</p>
                    <p className="text-xs text-on-surface-variant">Blocks all transactions. Account appears normal.</p>
                  </div>
                  <button onClick={() => setBillingMode(v => !v)}
                    className={`w-12 h-6 rounded-full transition-all relative ${billingMode ? "bg-error" : "bg-surface-container-high"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${billingMode ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              </div>

              {billingMode && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-error uppercase tracking-wider block">Custom Billing Message</label>
                  <textarea className={`${inputCls} resize-none`} rows={4}
                    placeholder="e.g. Your account has been temporarily restricted. Contact support@quincore.online"
                    value={billingMessage} onChange={e => { setBillingMessage(e.target.value); setErrorMsg(""); }} />
                </div>
              )}

              <button onClick={handleBilling} disabled={saving}
                className={`w-full py-2.5 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 ${billingMode ? "bg-error text-on-error" : "bg-primary text-on-primary"}`}>
                {saving ? "Saving…" : billingMode ? "Enable Billing Mode" : "Disable Billing Mode"}
              </button>

              {user.billingMode && (
                <div className="bg-error-container p-3 rounded-lg">
                  <p className="text-xs font-bold text-on-error-container">Current Message:</p>
                  <p className="text-xs text-on-error-container mt-1">{user.billingMessage || "No message set"}</p>
                </div>
              )}

              <div className="h-px bg-outline-variant" />

              {/* Generate Transaction History — VIP Only */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Generate Transaction History
                </label>
                <p className="text-xs text-on-surface-variant">Add 10–20 realistic transactions to this account. Existing transactions are kept.</p>
                <p className="text-[10px] text-on-surface-variant">Current transactions: <strong>{(user.transactions || []).length}</strong></p>
                <button onClick={handleGenerateHistory} disabled={saving}
                  className="w-full py-2.5 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  {saving ? "Generating…" : "Generate Fake History"}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === "support" && (
            <div className="space-y-4">
              {/* Current support info */}
              {user.supportType && (
                <div className="bg-secondary-container p-3 rounded-lg">
                  <p className="text-xs font-bold text-on-secondary-container">Current Support:</p>
                  <p className="text-xs text-on-secondary-container mt-1">
                    {user.supportType === "whatsapp" ? "📱 WhatsApp" : "📧 Gmail"} — {user.supportContact}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block">Support Type</label>
                <div className="flex gap-2">
                  {[["whatsapp","WhatsApp","chat"],["gmail","Gmail","mail"],["","None","block"]].map(([val, label, icon]) => (
                    <button key={val} type="button"
                      onClick={() => { setSupportType(val); setSupportContact(""); }}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${supportType === val ? "border-primary bg-primary text-on-primary" : "border-outline-variant text-on-surface-variant"}`}>
                      <span className="material-symbols-outlined text-[14px]">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {supportType && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider block">
                    {supportType === "whatsapp" ? "WhatsApp Link" : "Gmail Address"}
                  </label>
                  <input className={inputCls}
                    placeholder={supportType === "whatsapp" ? "https://wa.me/1234567890" : "support@example.com"}
                    value={supportContact}
                    onChange={e => { setSupportContact(e.target.value); setErrorMsg(""); }} />
                </div>
              )}
              <button onClick={handleSupport} disabled={saving}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60">
                {saving ? "Saving…" : "Save Support Settings"}
              </button>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Current PIN</p>
                <p className="font-hanken text-2xl font-bold text-primary tracking-widest">{user.pin || "—"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block">Reset PIN</label>
                <input className={inputCls} type="text" placeholder="Enter new 4–6 digit PIN"
                  value={newPin} onChange={e => { setNewPin(e.target.value); setErrorMsg(""); }}
                  maxLength={6} inputMode="numeric" />
                <button onClick={handleResetPin} disabled={saving}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60">
                  {saving ? "Saving…" : "Reset PIN"}
                </button>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {tab === "transactions" && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-on-surface-variant">{(user.transactions || []).length} total transactions</p>
              {[...(user.transactions || [])].reverse().map((tx, i) => {
                const isIn = ["received","deposit"].includes(tx.type);
                const isOut = ["sent","bill"].includes(tx.type);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                    <div className={`w-9 h-9 rounded-full ${tx.color || "bg-secondary-container"} flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[16px]">{tx.icon || "receipt"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{tx.description}</p>
                      <p className="text-[10px] text-on-surface-variant">{tx.date} · {tx.category}</p>
                    </div>
                    <p className={`text-xs font-bold flex-shrink-0 ${isIn ? "text-green-600" : isOut ? "text-error" : "text-primary"}`}>
                      {isIn ? "+" : isOut ? "-" : ""}{fmt(tx.amount, user.currencySymbol)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Invite Codes Panel ────────────────────────────────────────────────────────
function CodesPanel({ onClose }) {
  const [codes,   setCodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState("");

  useEffect(() => {
    getDocs(collection(db, "invite_codes")).then(snap => {
      setCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const resetCode = async (codeId) => {
    setSaving(codeId);
    await updateDoc(doc(db, "invite_codes", codeId), { used: false, usedBy: "", usedAt: "" });
    setCodes(prev => prev.map(c => c.id === codeId ? { ...c, used: false, usedBy: "" } : c));
    setSaving("");
  };

  const used   = codes.filter(c => c.used).length;
  const unused = codes.filter(c => !c.used).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-xl border border-outline-variant overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center">
          <div>
            <p className="font-hanken text-lg font-bold">Invite Codes</p>
            <p className="text-xs text-on-primary-container">{used} used · {unused} available</p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined">close</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><span className="material-symbols-outlined animate-spin text-primary">sync</span></div>
          ) : codes.map(code => (
            <div key={code.id} className={`flex items-center justify-between p-3 rounded-lg border ${code.used ? "border-error/30 bg-error-container/20" : "border-green-200 bg-green-50"}`}>
              <div>
                <p className="text-xs font-bold font-mono text-primary">{code.id}</p>
                {code.used && <p className="text-[10px] text-on-surface-variant mt-0.5">Used by: {code.usedBy}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${code.used ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-700"}`}>
                  {code.used ? "USED" : "FREE"}
                </span>
                {code.used && (
                  <button onClick={() => resetCode(code.id)} disabled={saving === code.id}
                    className="text-[10px] font-bold text-primary border border-primary px-2 py-0.5 rounded-full hover:bg-primary hover:text-on-primary transition-colors active:scale-95">
                    {saving === code.id ? "…" : "Reset"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Verify Panel ──────────────────────────────────────────────────────────────
function VerifyPanel({ users, onClose, onUpdate }) {
  const [saving, setSaving] = useState("");
  const [selected, setSelected] = useState(null);

  const pendingVerifications = users.filter(u => u.verificationRequest?.status === "Pending");
  const verifiedUsers = users.filter(u => u.verified);

  const handleVerify = async (user, approve) => {
    setSaving(user.id);
    try {
      await updateDoc(doc(db, "users", user.id), {
        verified: approve,
        verificationRequest: {
          ...user.verificationRequest,
          status: approve ? "Approved" : "Rejected",
          reviewedAt: new Date().toISOString(),
        },
      });
      onUpdate();
      setSelected(null);
    } finally { setSaving(""); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-xl border border-outline-variant overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <p className="font-hanken text-lg font-bold">Verification Requests</p>
            <p className="text-xs text-on-primary-container">{pendingVerifications.length} pending · {verifiedUsers.length} verified</p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined">close</button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {selected ? (
            <div className="space-y-4">
              <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs font-bold text-primary">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
              </button>
              <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Applicant Details</p>
                {[
                  ["Full Name", selected.fullName],
                  ["Legal Name", selected.verificationRequest?.legalName],
                  ["Email", selected.email],
                  ["Date of Birth", selected.dateOfBirth],
                  ["Country", selected.country],
                  ["ID Type", selected.verificationRequest?.idType],
                  ["ID Number", selected.verificationRequest?.idNumber],
                  ["Submitted", new Date(selected.verificationRequest?.submittedAt).toLocaleDateString()],
                ].map(([label, val]) => val ? (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-on-surface-variant">{label}</span>
                    <span className="text-xs font-bold text-primary text-right max-w-[55%]">{val}</span>
                  </div>
                ) : null)}
              </div>

              {/* Document Images */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["ID Photo", selected.verificationRequest?.idPhoto],
                  ["Selfie with ID", selected.verificationRequest?.selfie],
                ].filter(([, v]) => v).map(([label, src]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-on-surface-variant mb-1">{label}</p>
                    <img src={src} alt={label} className="w-full rounded-lg border border-outline-variant object-cover max-h-40 cursor-pointer"
                      onClick={() => window.open(src, "_blank")} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleVerify(selected, true)} disabled={!!saving}
                  className="py-3 bg-blue-600 text-white rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  {saving === selected.id ? "Processing…" : "Approve & Verify"}
                </button>
                <button onClick={() => handleVerify(selected, false)} disabled={!!saving}
                  className="py-3 bg-error text-on-error rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <>
              {pendingVerifications.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-on-surface-variant text-[48px]">verified</span>
                  <p className="text-sm text-on-surface-variant mt-2">No pending verification requests</p>
                </div>
              ) : pendingVerifications.map(user => (
                <div key={user.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4 cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => setSelected(user)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-primary">{user.fullName}</p>
                      <p className="text-xs text-on-surface-variant">{user.email}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {user.verificationRequest?.idType} · Submitted {new Date(user.verificationRequest?.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">⏳ Pending</span>
                  </div>
                </div>
              ))}

              {verifiedUsers.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Verified Accounts</p>
                  {verifiedUsers.map(user => (
                    <div key={user.id} className="border border-blue-200 bg-blue-50 rounded-xl p-3 mb-2 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-primary">{user.fullName}</p>
                        <p className="text-xs text-on-surface-variant">{user.email}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loans Panel ───────────────────────────────────────────────────────────────
function LoansPanel({ users, onClose, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState("");
  const [reason,   setReason]   = useState("");

  const allLoans = users.flatMap(u =>
    (u.loanApplications || []).map(loan => ({ ...loan, userData: u }))
  ).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const pending  = allLoans.filter(l => l.status === "Pending").length;
  const approved = allLoans.filter(l => l.status === "Approved").length;
  const rejected = allLoans.filter(l => l.status === "Rejected").length;

  const updateLoanStatus = async (loan, status) => {
    setSaving(loan.id);
    try {
      const user     = users.find(u => u.id === loan.userId);
      const newLoans = (user.loanApplications || []).map(l =>
        l.id === loan.id ? { ...l, status, rejectionReason: reason, reviewedAt: new Date().toISOString() } : l
      );
      const updates = { loanApplications: newLoans };
      if (status === "Approved") {
        updates.balance = (user.balance || 0) + loan.loanAmount;
        updates.transactions = [...(user.transactions || []), {
          id: `LOAN${Date.now()}`, type: "deposit", amount: loan.loanAmount,
          description: `Loan Approved — ${loan.loanPurpose}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          time: new Date().toLocaleTimeString(),
          status: "Completed", category: "Income",
          icon: "account_balance", color: "bg-primary-fixed",
        }];
      }
      await updateDoc(doc(db, "users", loan.userId), updates);
      onUpdate();
      setSelected(null); setReason("");
    } finally { setSaving(""); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-xl border border-outline-variant overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary text-on-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <p className="font-hanken text-lg font-bold">Loan Applications</p>
            <p className="text-xs text-on-primary-container">{pending} pending · {approved} approved · {rejected} rejected</p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined">close</button>
        </div>

        {selected ? (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            <button onClick={() => { setSelected(null); setReason(""); }} className="flex items-center gap-1 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to list
            </button>

            <div className="bg-primary-container rounded-xl p-4 text-on-primary">
              <p className="font-hanken text-lg font-bold">{selected.userData.fullName}</p>
              <p className="text-xs text-on-primary-container">{selected.userData.email} · {selected.userData.accountNumber}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  ["Loan Amount", `${selected.currencySymbol}${selected.loanAmount?.toLocaleString()}`],
                  ["Purpose", selected.loanPurpose],
                  ["Period", `${selected.repaymentPeriod} months`],
                  ["Monthly Payment", `${selected.currencySymbol}${selected.monthlyPayment}`],
                ].map(([l,v]) => (
                  <div key={l}>
                    <p className="text-[10px] text-on-primary-container">{l}</p>
                    <p className="text-sm font-bold">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                ["Personal", [
                  ["SSN", selected.ssn],
                  ["Gender", selected.gender],
                  ["Marital Status", selected.maritalStatus],
                  ["Dependants", selected.dependants],
                  ["City/State", `${selected.city}, ${selected.state} ${selected.zipCode}`],
                  ["Time at Address", selected.timeAtAddress],
                ]],
                ["Contact", [
                  ["Phone", selected.phone],
                  ["Email", selected.email],
                  ["Mailing Address", selected.mailingAddress],
                  ["Preferred Contact", selected.preferredContact],
                ]],
                ["Employment", [
                  ["Status", selected.employmentStatus],
                  ["Employer", selected.employerName],
                  ["Job Title", selected.jobTitle],
                  ["Work Address", selected.workAddress],
                  ["Monthly Income", `${selected.currencySymbol}${parseFloat(selected.monthlyIncome||0).toLocaleString()}`],
                  ["Monthly Expenses", `${selected.currencySymbol}${parseFloat(selected.monthlyExpenses||0).toLocaleString()}`],
                  ["Existing Loans", selected.existingLoans],
                ]],
                ["ID & Documents", [
                  ["ID Type", selected.idType],
                  ["ID Number", selected.idNumber],
                  ["ID Expiry", selected.idExpiry],
                ]],
                ["Next of Kin", [
                  ["Name", selected.kinName],
                  ["Relationship", selected.kinRelationship],
                  ["Phone", selected.kinPhone],
                  ["Email", selected.kinEmail],
                  ["Address", selected.kinAddress],
                ]],
              ].map(([section, fields]) => (
                <div key={section} className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{section}</p>
                  <div className="space-y-1">
                    {fields.map(([label, val]) => val ? (
                      <div key={label} className="flex justify-between">
                        <span className="text-xs text-on-surface-variant">{label}</span>
                        <span className="text-xs font-bold text-primary text-right max-w-[55%]">{val}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>

            {/* Document Images */}
            {(selected.idFront || selected.idBack || selected.selfieWithId || selected.proofOfAddress || selected.proofOfIncome) && (
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Uploaded Documents</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["ID Front",        selected.idFront],
                    ["ID Back",         selected.idBack],
                    ["Selfie with ID",  selected.selfieWithId],
                    ["Proof of Address",selected.proofOfAddress],
                    ["Proof of Income", selected.proofOfIncome],
                  ].filter(([,v]) => v).map(([label, src]) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1">{label}</p>
                      <img src={src} alt={label} className="w-full rounded-lg border border-outline-variant object-cover max-h-32 cursor-pointer"
                        onClick={() => window.open(src, "_blank")} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Actions */}
            {selected.status === "Pending" && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-primary block mb-1">Rejection Reason (if rejecting)</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-outline-variant text-sm focus:outline-none bg-white"
                    placeholder="Optional reason for rejection"
                    value={reason} onChange={e => setReason(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => updateLoanStatus(selected, "Approved")} disabled={!!saving}
                    className="py-3 bg-green-600 text-white rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {saving === selected.id ? "Processing…" : `Approve & Fund ${selected.currencySymbol}${selected.loanAmount?.toLocaleString()}`}
                  </button>
                  <button onClick={() => updateLoanStatus(selected, "Rejected")} disabled={!!saving}
                    className="py-3 bg-error text-on-error rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    {saving === selected.id ? "Processing…" : "Reject"}
                  </button>
                </div>
              </div>
            )}

            {selected.status !== "Pending" && (
              <div className={`p-3 rounded-lg ${selected.status === "Approved" ? "bg-green-100" : "bg-error-container"}`}>
                <p className={`text-xs font-bold ${selected.status === "Approved" ? "text-green-700" : "text-on-error-container"}`}>
                  {selected.status === "Approved" ? "✅ Loan Approved — Funds disbursed to account" : `❌ Loan Rejected${selected.rejectionReason ? ` — ${selected.rejectionReason}` : ""}`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {allLoans.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-on-surface-variant text-[48px]">account_balance</span>
                <p className="text-sm text-on-surface-variant mt-2">No loan applications yet</p>
              </div>
            ) : allLoans.map(loan => (
              <div key={loan.id} className="border border-outline-variant rounded-xl p-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                onClick={() => setSelected(loan)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-primary">{loan.userData.fullName}</p>
                    <p className="text-xs text-on-surface-variant">{loan.userData.email}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{loan.loanPurpose} · {loan.repaymentPeriod} months</p>
                    <p className="text-[10px] text-on-surface-variant">{new Date(loan.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{loan.currencySymbol}{loan.loanAmount?.toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      loan.status === "Approved" ? "bg-green-100 text-green-700" :
                      loan.status === "Rejected" ? "bg-error-container text-on-error-container" :
                      "bg-amber-100 text-amber-700"
                    }`}>{loan.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed,       setAuthed]       = useState(false);
  const [loginForm,    setLoginForm]    = useState({ email: "", password: "" });
  const [loginError,   setLoginError]   = useState("");
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCodes,    setShowCodes]    = useState(false);
  const [showLoans,    setShowLoans]    = useState(false);
  const [showVerify,   setShowVerify]   = useState(false);
  const [filterTier,   setFilterTier]   = useState("All");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Failed to fetch users:", e); }
    finally { setLoading(false); }
  };

  const handleLogin = () => {
    if (loginForm.email === ADMIN_EMAIL && loginForm.password === ADMIN_PASSWORD) {
      setAuthed(true);
      fetchUsers();
    } else {
      setLoginError("Invalid admin credentials.");
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.accountNumber?.toLowerCase().includes(q);
    const matchTier = filterTier === "All" || u.accountType === filterTier;
    return matchSearch && matchTier;
  });

  const totalBalance = users.reduce((s, u) => s + (u.balance || 0), 0);
  const billingCount = users.filter(u => u.billingMode).length;
  const todayUsers   = users.filter(u => {
    if (!u.createdAt?.toDate) return false;
    const d = u.createdAt.toDate();
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length;

  // ── Login Screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl border border-outline-variant p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-on-primary text-[32px]">admin_panel_settings</span>
            </div>
            <h1 className="font-hanken text-2xl font-bold text-primary">Admin Panel</h1>
            <p className="text-xs text-on-surface-variant mt-1">QuinCore Bank Management</p>
          </div>
          {loginError && <p className="text-error text-xs font-bold mb-4 text-center">{loginError}</p>}
          <div className="space-y-3">
            <input
              className="w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary bg-white"
              type="email" placeholder="Admin email"
              value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))} />
            <input
              className="w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary bg-white"
              type="password" placeholder="Admin password"
              value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <button onClick={handleLogin}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 transition-transform">
              Sign In to Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-primary text-on-primary px-4 py-3 sticky top-0 z-40 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            <div>
              <h1 className="font-hanken text-base font-bold leading-tight">QuinCore Admin</h1>
              <p className="text-[10px] text-on-primary-container">Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowVerify(true)}
              className="px-2 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span className="hidden sm:inline">Verify</span>
            </button>
            <button onClick={() => setShowLoans(true)}
              className="px-2 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95">
              <span className="material-symbols-outlined text-[14px]">account_balance</span>
              <span className="hidden sm:inline">Loan Apps</span>
              <span className="sm:hidden">Loans</span>
            </button>
            <button onClick={() => setShowCodes(true)}
              className="px-2 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-[10px] font-bold flex items-center gap-1 active:scale-95">
              <span className="material-symbols-outlined text-[14px]">vpn_key</span>
              <span className="hidden sm:inline">Invite Codes</span>
              <span className="sm:hidden">Codes</span>
            </button>
            <button onClick={() => setAuthed(false)}
              className="px-2 py-1.5 border border-on-primary-container text-on-primary-container rounded-lg text-[10px] font-bold active:scale-95">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="group"           label="Total Users"   value={users.length}      color="bg-secondary-container" />
          <StatCard icon="account_balance" label="Total Funds"   value={fmt(totalBalance)} color="bg-primary-fixed" />
          <StatCard icon="person_add"      label="New Today"     value={todayUsers}        color="bg-tertiary-fixed" />
          <StatCard icon="block"           label="Billing Mode"  value={billingCount}      color="bg-error-container" />
        </div>

        {/* Users Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <h2 className="font-hanken text-xl font-bold text-primary">All Users</h2>
            <div className="flex gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 gap-2 flex-1 md:w-64">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-on-surface-variant/50"
                  placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {/* Tier filter */}
              <select className="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold bg-white focus:outline-none"
                value={filterTier} onChange={e => setFilterTier(e.target.value)}>
                {["All","Bronze","Silver","Gold","Platinum"].map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={fetchUsers} className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-low active:scale-95">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {["User","Account Number","Balance","Tier","Status","Txns","Action"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-on-surface-variant">No users found</td></tr>
                    ) : filtered.map(u => (
                      <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-on-primary text-xs font-bold">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{u.fullName}</p>
                              <p className="text-xs text-on-surface-variant">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{u.accountNumber}</td>
                        <td className="px-4 py-3 text-sm font-bold text-primary">{fmt(u.balance, u.currencySymbol)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">{u.accountType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.billingMode ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-700"}`}>
                            {u.billingMode ? "Restricted" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{(u.transactions || []).length}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedUser(u)}
                            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 hover:opacity-90">
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-4 space-y-3">
                {filtered.map(u => (
                  <div key={u.id} className="border border-outline-variant rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-primary">{u.fullName}</p>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                        <p className="text-xs font-mono text-on-surface-variant mt-0.5">{u.accountNumber}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.billingMode ? "bg-error-container text-on-error-container" : "bg-green-100 text-green-700"}`}>
                        {u.billingMode ? "Restricted" : "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-hanken text-lg font-bold text-primary">{fmt(u.balance, u.currencySymbol)}</span>
                      <button onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-lowest">
                <p className="text-xs text-on-surface-variant">Showing {filtered.length} of {users.length} users</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => { fetchUsers(); setSelectedUser(null); }}
        />
      )}
      {showCodes && <CodesPanel onClose={() => setShowCodes(false)} />}
      {showLoans && <LoansPanel users={users} onClose={() => setShowLoans(false)} onUpdate={fetchUsers} />}
      {showVerify && <VerifyPanel users={users} onClose={() => setShowVerify(false)} onUpdate={fetchUsers} />}
    </div>
  );
}