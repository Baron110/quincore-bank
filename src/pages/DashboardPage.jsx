import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";
import { fmt, generateTxnId, nowDateTime, TXN_META } from "../utils";

// ─── EmailJS ──────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = "service_sn7i0ob";
const EMAILJS_TEMPLATE_ID = "template_239am4e";
const EMAILJS_PUBLIC_KEY  = "qyX5zHQs3vzkNzM7m";

const sendTransactionEmail = async (params) => {
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, EMAILJS_PUBLIC_KEY);
  } catch (err) {
    console.error("Email failed:", err);
  }
};

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSubmit, loading, submitLabel = "Confirm", children, success }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-[520px] rounded-xl shadow-xl border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center border-b border-outline-variant/30">
          <h2 className="font-hanken text-xl font-bold text-primary">{title}</h2>
          <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant active:scale-95">close</button>
        </div>
        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <p className="font-hanken text-xl font-bold text-primary">{success}</p>
            </div>
          ) : (
            <>
              {children}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 border border-outline-variant py-3 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={onSubmit} disabled={loading}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Processing…</>
                    : submitLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary transition-colors bg-white";

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate  = useNavigate();
  const uid       = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);

  // Modal state
  const [modal,        setModal]        = useState(null);
  const [modalStep,    setModalStep]    = useState(1); // 1=form, 2=pin, 3=success
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError,   setModalError]   = useState("");
  const [pinInput,     setPinInput]     = useState("");

  // Form states
  const [sendMethod,      setSendMethod]      = useState("email"); // "email" | "account"
  const [sendForm,        setSendForm]        = useState({ recipientEmail: "", recipientAccount: "", amount: "", purpose: "" });
  const [depositAmt,      setDepositAmt]      = useState("");
  const [requestForm,     setRequestForm]     = useState({ recipientEmail: "", amount: "", note: "" });
  const [billForm,        setBillForm]        = useState({ billType: "", amount: "", ref: "" });
  const [lookupName,      setLookupName]      = useState(""); // recipient name from account number lookup
  const [lookupLoading,   setLookupLoading]   = useState(false);

  // Pending transaction data (set before PIN step)
  const [pendingTxn, setPendingTxn] = useState(null);

  const openModal = (name) => {
    setModal(name); setModalStep(1); setModalError("");
    setPinInput(""); setPendingTxn(null); setSendMethod("email");
    setSendForm({ recipientEmail: "", recipientAccount: "", amount: "", purpose: "" });
    setDepositAmt(""); setLookupName(""); setLookupLoading(false);
    setRequestForm({ recipientEmail: "", amount: "", note: "" });
    setBillForm({ billType: "", amount: "", ref: "" });
  };

  // Live account number lookup
  const lookupAccountNumber = async (accountNumber) => {
    if (accountNumber.length < 8) { setLookupName(""); return; }
    setLookupLoading(true); setLookupName("");
    try {
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("accountNumber", "==", accountNumber.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLookupName(snap.docs[0].data().fullName || "QuinCore User");
      } else {
        setLookupName("not_found");
      }
    } catch { setLookupName(""); }
    finally { setLookupLoading(false); }
  };
  const closeModal = () => { setModal(null); setModalStep(1); setModalError(""); setPinInput(""); };

  const addTxn = async (targetUid, txn, delta) => {
    const ref  = doc(db, "users", targetUid);
    const snap = await getDoc(ref);
    await updateDoc(ref, { balance: snap.data().balance + delta, transactions: arrayUnion(txn) });
  };

  // ── Verify PIN then execute ─────────────────────────────────────────────────
  const handlePinVerify = async () => {
    if (pinInput !== userData.pin) {
      setModalError("Incorrect PIN. Please try again.");
      setPinInput("");
      return;
    }
    // If billing mode is on, show billing message instead of executing
    if (userData && userData.billingMode) {
      setPinInput("");
      setModal("billing");
      return;
    }
    setModalError("");
    setModalLoading(true);
    try {
      await pendingTxn();
    } finally {
      setModalLoading(false);
    }
  };

  // ── Send Money ──────────────────────────────────────────────────────────────
  const validateSend = () => {
    const amount = parseFloat(sendForm.amount);
    if (sendMethod === "email" && !sendForm.recipientEmail) { setModalError("Enter recipient email."); return false; }
    if (sendMethod === "account" && !sendForm.recipientAccount) { setModalError("Enter account number."); return false; }
    if (!amount || amount <= 0) { setModalError("Enter a valid amount."); return false; }
    if (sendMethod === "email" && sendForm.recipientEmail.toLowerCase() === userData.email) { setModalError("Cannot send to yourself."); return false; }
    if (amount > userData.balance) { setModalError("Insufficient balance."); return false; }
    return true;
  };

  const executeSend = async () => {
    const amount = parseFloat(sendForm.amount);
    const sym    = userData.currencySymbol || "$";
    const senderCurrency = userData.currency || "USD";
    const { getDocs, collection, query, where } = await import("firebase/firestore");

    let recipientSnap = null;
    if (sendMethod === "email") {
      const q = query(collection(db, "users"), where("email", "==", sendForm.recipientEmail.toLowerCase().trim()));
      recipientSnap = await getDocs(q);
    } else {
      const q = query(collection(db, "users"), where("accountNumber", "==", sendForm.recipientAccount.trim()));
      recipientSnap = await getDocs(q);
    }

    const ts  = nowDateTime();
    const id  = generateTxnId();
    const recipientIdentifier = sendMethod === "email" ? sendForm.recipientEmail : sendForm.recipientAccount;

    await addTxn(uid, {
      id, type: "sent", amount,
      description: `Sent to ${recipientIdentifier}`,
      purpose: sendForm.purpose || "Transfer",
      ...ts, status: "Completed", category: "Transfer",
      icon: TXN_META.sent.icon, color: TXN_META.sent.color,
    }, -amount);

    let recipientName = recipientIdentifier;
    let recipientEmail = sendMethod === "email" ? sendForm.recipientEmail : "";

    if (recipientSnap && !recipientSnap.empty) {
      const recipientDoc  = recipientSnap.docs[0];
      const recipientData = recipientDoc.data();
      recipientName  = recipientData.fullName || recipientIdentifier;
      recipientEmail = recipientData.email;

      // ── Currency Conversion ──────────────────────────────────────────────
      let convertedAmount = amount;
      const recipientCurrency = recipientData.currency || "USD";
      const recipientSym      = recipientData.currencySymbol || "$";

      if (senderCurrency !== recipientCurrency) {
        try {
          const res  = await fetch(`https://api.exchangerate-api.com/v4/latest/${senderCurrency}`);
          const data = await res.json();
          const rate = data.rates[recipientCurrency];
          if (rate) convertedAmount = Math.round(amount * rate * 100) / 100;
        } catch {
          // fallback — use 1:1 if API fails
          convertedAmount = amount;
        }
      }

      await addTxn(recipientDoc.id, {
        id: generateTxnId(), type: "received", amount: convertedAmount,
        description: `Received from ${userData.fullName || userData.email}${senderCurrency !== recipientCurrency ? ` (converted from ${sym}${amount} ${senderCurrency})` : ""}`,
        ...ts, status: "Completed", category: "Transfer",
        icon: TXN_META.received.icon, color: TXN_META.received.color,
      }, convertedAmount);

      await sendTransactionEmail({
        to_email: recipientEmail, recipient_name: recipientData.firstName || "there",
        subject: `You received ${fmt(amount, sym)}`,
        message: `You received ${fmt(amount, sym)} from ${userData.email}.`,
        transaction_type: "💰 Credit", amount: fmt(amount, sym),
        date: ts.date, transaction_id: generateTxnId(),
        new_balance: fmt(recipientData.balance + amount, sym),
        footer_note: "Log in to QuinCore to view details.",
      });
    }

    await sendTransactionEmail({
      to_email: userData.email, recipient_name: userData.firstName,
      subject: `You sent ${fmt(amount, sym)}`,
      message: `You sent ${fmt(amount, sym)} to ${recipientIdentifier}.`,
      transaction_type: "💸 Debit", amount: fmt(amount, sym),
      date: ts.date, transaction_id: id,
      new_balance: fmt(userData.balance - amount, sym),
      footer_note: "If unauthorized, contact support immediately.",
    });

    closeModal();
    navigate("/receipt", {
      state: {
        amount: amount.toFixed(2),
        recipientName,
        recipientEmail,
        transactionId: id,
        date: ts.date, time: ts.time,
        type: "Transfer",
        newBalance: (userData.balance - amount).toFixed(2),
        symbol: sym,
      },
    });
  };

  // ── Deposit ─────────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmt);
    if (isNaN(amount) || amount < 10) { setModalError("Minimum deposit is 10."); return; }
    setModalLoading(true); setModalError("");
    try {
      const ts  = nowDateTime();
      const sym = userData.currencySymbol || "$";
      const id  = generateTxnId();
      await addTxn(uid, {
        id, type: "deposit", amount, description: "Manual deposit",
        ...ts, status: "Completed", category: "Income",
        icon: TXN_META.deposit.icon, color: TXN_META.deposit.color,
      }, amount);

      await sendTransactionEmail({
        to_email: userData.email, recipient_name: userData.firstName,
        subject: `Deposit Confirmed — ${fmt(amount, sym)}`,
        message: `Your deposit of ${fmt(amount, sym)} was successful.`,
        transaction_type: "💰 Credit", amount: fmt(amount, sym),
        date: ts.date, transaction_id: id,
        new_balance: fmt(userData.balance + amount, sym),
        footer_note: "Thank you for banking with QuinCore.",
      });

      closeModal();
      navigate("/receipt", {
        state: {
          amount: amount.toFixed(2),
          recipientName: "Your Account",
          recipientEmail: userData.email,
          transactionId: id,
          date: ts.date, time: ts.time,
          type: "deposit",
          newBalance: (userData.balance + amount).toFixed(2),
          symbol: sym,
        },
      });
    } catch (e) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  // ── Request Money ───────────────────────────────────────────────────────────
  const handleRequest = async () => {
    const amount = parseFloat(requestForm.amount);
    if (!requestForm.recipientEmail || isNaN(amount) || amount <= 0) { setModalError("Fill all fields."); return; }
    setModalLoading(true); setModalError("");
    try {
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const q    = query(collection(db, "users"), where("email", "==", requestForm.recipientEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      const ts   = nowDateTime();
      await updateDoc(doc(db, "users", uid), {
        transactions: arrayUnion({
          id: generateTxnId(), type: "request", amount,
          description: `Request sent to ${requestForm.recipientEmail}`,
          note: requestForm.note, ...ts, status: "Pending", category: "Request",
          icon: TXN_META.request.icon, color: TXN_META.request.color,
        }),
      });
      if (!snap.empty) {
        await updateDoc(doc(db, "users", snap.docs[0].id), {
          transactions: arrayUnion({
            id: generateTxnId(), type: "request_received", amount,
            description: `${userData.email} requested money from you`,
            note: requestForm.note, ...ts, status: "Pending", category: "Request",
            icon: TXN_META.request_received.icon, color: TXN_META.request_received.color,
          }),
        });
      }
      setModal(null);
      setModalStep(1);
    } catch (e) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  // ── Pay Bill ────────────────────────────────────────────────────────────────
  const validateBill = () => {
    const amount = parseFloat(billForm.amount);
    if (!billForm.billType || isNaN(amount) || amount <= 0) { setModalError("Fill all fields."); return false; }
    if (amount > userData.balance) { setModalError("Insufficient balance."); return false; }
    return true;
  };

  const executeBill = async () => {
    const amount = parseFloat(billForm.amount);
    const sym    = userData.currencySymbol || "$";
    const ts     = nowDateTime();
    const id     = generateTxnId();
    await addTxn(uid, {
      id, type: "bill", amount,
      description: `${billForm.billType} bill payment`,
      accountRef: billForm.ref, ...ts, status: "Completed", category: "Bills",
      icon: TXN_META.bill.icon, color: TXN_META.bill.color,
    }, -amount);

    await sendTransactionEmail({
      to_email: userData.email, recipient_name: userData.firstName,
      subject: `Bill Payment Confirmed — ${fmt(amount, sym)}`,
      message: `Your ${billForm.billType} bill of ${fmt(amount, sym)} was paid.`,
      transaction_type: "🧾 Bill Payment", amount: fmt(amount, sym),
      date: ts.date, transaction_id: id,
      new_balance: fmt(userData.balance - amount, sym),
      footer_note: "If unauthorized, contact support immediately.",
    });

    closeModal();
    navigate("/receipt", {
      state: {
        amount: amount.toFixed(2),
        recipientName: billForm.billType,
        recipientEmail: "",
        transactionId: id,
        date: ts.date, time: ts.time,
        type: "bill",
        newBalance: (userData.balance - amount).toFixed(2),
        symbol: sym,
      },
    });
  };

  // ── Loading / No Data ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-xs font-semibold text-on-surface-variant mt-4">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    import("firebase/auth").then(({ getAuth, signOut }) => {
      signOut(getAuth()).then(() => { window.location.href = "/login"; });
    });
    return null;
  }

  const recentTxns    = [...(userData.transactions || [])].reverse().slice(0, 3);
  const sym           = userData.currencySymbol || "$";
  const totalSpent    = (userData.transactions || []).filter(t => ["sent","bill"].includes(t.type)).reduce((s,t) => s + t.amount, 0);
  const totalReceived = (userData.transactions || []).filter(t => ["received","deposit"].includes(t.type)).reduce((s,t) => s + t.amount, 0);
  const savingsRate   = totalReceived > 0 ? Math.max(0, Math.round(((totalReceived - totalSpent) / totalReceived) * 100)) : 0;

  // ── PIN Step UI ─────────────────────────────────────────────────────────────
  const PinStep = ({ onBack }) => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-primary text-[28px]">lock</span>
        </div>
        <p className="text-sm font-semibold text-primary">Enter your transaction PIN to confirm</p>
        <p className="text-xs text-on-surface-variant mt-1">This is the PIN you set during signup</p>
      </div>
      {modalError && <p className="text-error text-xs text-center font-semibold">{modalError}</p>}
      <div className="flex justify-center gap-2">
        {[0,1,2,3,4,5].slice(0, userData.pin?.length || 4).map((_, i) => (
          <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
            pinInput[i] ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-low"
          }`}>
            {pinInput[i] ? "•" : ""}
          </div>
        ))}
      </div>
      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((key, i) => (
          <button key={i} type="button"
            onClick={() => {
              if (key === "⌫") { setPinInput(p => p.slice(0,-1)); setModalError(""); }
              else if (key !== "" && pinInput.length < (userData.pin?.length || 4)) {
                setPinInput(p => p + String(key));
              }
            }}
            className={`h-12 rounded-xl text-base font-bold transition-all active:scale-95 ${
              key === "" ? "invisible" :
              key === "⌫" ? "bg-error-container text-on-error-container" :
              "bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant"
            }`}>
            {key}
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={() => { setModalStep(1); setModalError(""); setPinInput(""); }}
          className="flex-1 border border-outline-variant py-3 rounded-lg text-xs font-bold text-on-surface-variant">
          Back
        </button>
        <button
          onClick={handlePinVerify}
          disabled={modalLoading || pinInput.length < (userData.pin?.length || 4)}
          className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2">
          {modalLoading
            ? <><span className="material-symbols-outlined text-[16px] animate-spin">sync</span> Verifying…</>
            : "Confirm"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />

      <div className="md:ml-64 min-h-screen pb-24 md:pb-lg">
        <Header title="Dashboard Overview" userData={userData} />

        <div className="px-gutter py-md max-w-container-max mx-auto space-y-lg">

          {/* ── Balance Hero ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <section className="lg:col-span-8 bg-primary-container rounded-xl p-lg text-on-primary shadow-lg flex flex-col justify-between min-h-[240px] relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-secondary-fixed/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-label-md text-on-primary-container text-xs">Available Balance</p>
                  <h2 className="font-hanken font-bold mt-1 text-3xl md:text-5xl break-all leading-tight">{fmt(userData.balance, sym)}</h2>
                </div>
                <div className="bg-secondary-fixed text-on-secondary-fixed px-2 py-1 rounded-lg flex items-center gap-1 flex-shrink-0 text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {userData.accountType?.toUpperCase()} TIER
                </div>
              </div>
              <div className="relative z-10 flex justify-between items-end mt-xl">
                <div>
                  <p className="font-label-sm text-on-primary-container tracking-widest uppercase text-[10px]">Account Number</p>
                  <p className="font-body-md mt-xs text-sm">{userData.accountNumber}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
                  <span className="material-symbols-outlined">contactless</span>
                </div>
              </div>
            </section>

            <section className="lg:col-span-4 flex flex-col gap-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex-grow flex flex-col justify-center">
                <p className="font-label-sm text-on-surface-variant uppercase text-[10px]">Total Spent (Month)</p>
                <div className="flex items-baseline gap-xs mt-base">
                  <h3 className="font-hanken text-xl font-bold">{fmt(totalSpent, sym)}</h3>
                  <span className="text-error text-xs flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex-grow flex flex-col justify-center">
                <p className="font-label-sm text-on-surface-variant uppercase text-[10px]">Total Received</p>
                <div className="flex items-baseline gap-xs mt-base">
                  <h3 className="font-hanken text-xl font-bold">{fmt(totalReceived, sym)}</h3>
                  <span className="text-primary text-xs flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ── Quick Actions ── */}
          <section>
            <h3 className="font-label-md text-on-surface-variant mb-md uppercase tracking-wider text-xs">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              {[
                { label: "Send Money", icon: "send",          action: () => openModal("send") },
                { label: "Deposit",    icon: "payments",      action: () => openModal("deposit") },
                { label: "Request",    icon: "request_quote", action: () => openModal("request") },
                { label: "Pay Bills",  icon: "receipt",       action: () => openModal("bill") },
              ].map((q) => (
                <button key={q.label} onClick={q.action}
                  className="flex flex-col items-center justify-center p-md bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary transition-all active:scale-95">
                  <span className="material-symbols-outlined text-primary mb-sm text-[32px]">{q.icon}</span>
                  <span className="font-label-md text-xs font-bold">{q.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Bottom Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-md border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-hanken text-lg font-bold">Recent Transactions</h3>
                <Link to="/transactions" className="text-primary font-label-md hover:underline text-xs font-bold">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-md py-sm text-xs font-bold text-on-surface-variant">Description</th>
                      <th className="px-md py-sm text-xs font-bold text-on-surface-variant">Date</th>
                      <th className="px-md py-sm text-xs font-bold text-on-surface-variant">Amount</th>
                      <th className="px-md py-sm text-xs font-bold text-on-surface-variant text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {recentTxns.length === 0 ? (
                      <tr><td colSpan={4} className="px-md py-lg text-center text-xs font-semibold text-on-surface-variant">No transactions yet</td></tr>
                    ) : recentTxns.map((tx) => {
                      const isIn  = ["received","deposit"].includes(tx.type);
                      const isOut = ["sent","bill"].includes(tx.type);
                      return (
                        <tr key={tx.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-md py-md flex items-center gap-md">
                            <div className={`w-10 h-10 rounded-lg ${tx.color || "bg-secondary-container"} flex items-center justify-center flex-shrink-0`}>
                              <span className="material-symbols-outlined">{tx.icon || "receipt"}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-label-md text-xs font-bold truncate max-w-[120px] md:max-w-none">{tx.description}</p>
                              <p className="text-xs text-on-surface-variant">{tx.category}</p>
                            </div>
                          </td>
                          <td className="px-md py-md text-xs">{tx.date}</td>
                          <td className={`px-md py-md text-xs font-bold ${isIn ? "text-green-600" : isOut ? "text-error" : "text-primary"}`}>
                            {isIn ? "+" : isOut ? "-" : ""}{fmt(tx.amount, sym)}
                          </td>
                          <td className="px-md py-md text-right">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${tx.status === "Completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="lg:col-span-4 space-y-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl">
                <h3 className="font-label-md text-on-surface-variant mb-md uppercase tracking-wider text-xs font-bold">Savings Rate</h3>
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-hanken text-2xl font-bold">{savingsRate}%</span>
                  <span className="text-on-surface-variant text-xs">Goal: 30%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${Math.min(100, savingsRate)}%` }} />
                </div>
                <p className="mt-md text-xs text-on-surface-variant">Keep growing your savings, {userData.firstName}!</p>
              </div>
              <div className="bg-primary-container p-md rounded-xl text-on-primary">
                <h4 className="font-label-md text-on-primary-container mb-sm text-xs font-bold">Premium Insights</h4>
                <p className="text-xs italic">"Track your spending and hit your savings goal faster."</p>
                <Link to="/analytics">
                  <button className="mt-md w-full py-sm bg-secondary-fixed text-on-secondary-fixed rounded-lg font-label-md active:scale-95 transition-transform text-xs font-bold">
                    Explore Analytics
                  </button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

      {/* SEND MONEY */}
      {modal === "send" && (
        <Modal title="Send Money" onClose={closeModal}
          onSubmit={modalStep === 1 ? () => { if (!validateSend()) return; setPendingTxn(() => executeSend); setModalStep(2); } : handlePinVerify}
          loading={modalLoading}
          submitLabel={modalStep === 1 ? "Continue →" : "Confirm & Send"}>
          {modalStep === 1 ? (
            <div className="space-y-4">
              {modalError && <p className="text-error text-xs font-semibold">{modalError}</p>}

              {/* Send method toggle */}
              <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl border border-outline-variant/50">
                {[["email","Via Email","email"],["account","Via Account No.","tag"]].map(([val, label, icon]) => (
                  <button key={val} type="button" onClick={() => { setSendMethod(val); setModalError(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${sendMethod === val ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {sendMethod === "email" ? (
                <Field label="Recipient Email">
                  <input className={inputCls} type="email" placeholder="friend@email.com"
                    value={sendForm.recipientEmail} onChange={e => setSendForm(p => ({ ...p, recipientEmail: e.target.value }))} />
                </Field>
              ) : (
                <Field label="Recipient Account Number">
                  <input className={inputCls} placeholder="e.g. QC847291038472"
                    value={sendForm.recipientAccount}
                    onChange={e => {
                      const val = e.target.value;
                      setSendForm(p => ({ ...p, recipientAccount: val }));
                      lookupAccountNumber(val);
                    }} />
                  {lookupLoading && (
                    <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Looking up account…
                    </p>
                  )}
                  {!lookupLoading && lookupName && lookupName !== "not_found" && (
                    <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> {lookupName}
                    </p>
                  )}
                  {!lookupLoading && lookupName === "not_found" && sendForm.recipientAccount.length >= 8 && (
                    <p className="text-xs text-error font-bold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span> Account not found on QuinCore
                    </p>
                  )}
                </Field>
              )}

              <Field label={`Amount (${sym})`}>
                <input className={inputCls} type="number" placeholder="0.00"
                  value={sendForm.amount} onChange={e => setSendForm(p => ({ ...p, amount: e.target.value }))} />
                <p className="text-xs text-on-surface-variant mt-1">Available: {fmt(userData.balance, sym)}</p>
              </Field>

              <Field label="Purpose (optional)">
                <input className={inputCls} placeholder="e.g. Rent, Lunch…"
                  value={sendForm.purpose} onChange={e => setSendForm(p => ({ ...p, purpose: e.target.value }))} />
              </Field>
            </div>
          ) : (
            <PinStep onBack={() => { setModalStep(1); setModalError(""); setPinInput(""); }} />
          )}
        </Modal>
      )}

      {/* DEPOSIT */}
      {modal === "deposit" && (
        <Modal title="Deposit Funds" onClose={closeModal} onSubmit={handleDeposit} loading={modalLoading} submitLabel="Deposit">
          {modalError && <p className="text-error text-xs font-semibold">{modalError}</p>}
          <div className="flex flex-wrap gap-2 mb-2">
            {[100, 500, 1000, 2500, 5000].map(amt => (
              <button key={amt} type="button" onClick={() => setDepositAmt(String(amt))}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${depositAmt === String(amt) ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant"}`}>
                {sym}{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <Field label={`Amount (${sym})`}>
            <input className={inputCls} type="number" placeholder="Enter amount"
              value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
            <p className="text-xs text-on-surface-variant mt-1">Minimum: {sym}10</p>
          </Field>
        </Modal>
      )}

      {/* REQUEST MONEY */}
      {modal === "request" && (
        <Modal title="Request Money" onClose={closeModal} onSubmit={handleRequest} loading={modalLoading} submitLabel="Send Request">
          {modalError && <p className="text-error text-xs font-semibold">{modalError}</p>}
          <Field label="Request From (Email)">
            <input className={inputCls} type="email" placeholder="contact@email.com"
              value={requestForm.recipientEmail} onChange={e => setRequestForm(p => ({ ...p, recipientEmail: e.target.value }))} />
          </Field>
          <Field label={`Amount (${sym})`}>
            <input className={inputCls} type="number" placeholder="0.00"
              value={requestForm.amount} onChange={e => setRequestForm(p => ({ ...p, amount: e.target.value }))} />
          </Field>
          <Field label="Note (optional)">
            <input className={inputCls} placeholder="e.g. For dinner last Friday"
              value={requestForm.note} onChange={e => setRequestForm(p => ({ ...p, note: e.target.value }))} />
          </Field>
        </Modal>
      )}

      {/* PAY BILL */}
      {modal === "bill" && (
        <Modal title="Pay Bill" onClose={closeModal}
          onSubmit={modalStep === 1 ? () => { if (!validateBill()) return; setPendingTxn(() => executeBill); setModalStep(2); } : handlePinVerify}
          loading={modalLoading}
          submitLabel={modalStep === 1 ? "Continue →" : "Confirm & Pay"}>
          {modalStep === 1 ? (
            <div className="space-y-4">
              {modalError && <p className="text-error text-xs font-semibold">{modalError}</p>}
              <Field label="Bill Type">
                <select className={inputCls} value={billForm.billType} onChange={e => setBillForm(p => ({ ...p, billType: e.target.value }))}>
                  <option value="">Select bill type</option>
                  {["Electricity","Water","Internet","Mobile / Phone","Gas","Rent","Subscription","Insurance","Shopping"].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Amount (${sym})`}>
                <input className={inputCls} type="number" placeholder="0.00"
                  value={billForm.amount} onChange={e => setBillForm(p => ({ ...p, amount: e.target.value }))} />
                <p className="text-xs text-on-surface-variant mt-1">Available: {fmt(userData.balance, sym)}</p>
              </Field>
              <Field label="Reference (optional)">
                <input className={inputCls} placeholder="Account or reference number"
                  value={billForm.ref} onChange={e => setBillForm(p => ({ ...p, ref: e.target.value }))} />
              </Field>
            </div>
          ) : (
            <PinStep onBack={() => { setModalStep(1); setModalError(""); setPinInput(""); }} />
          )}
        </Modal>
      )}

      {/* BILLING MODE MODAL */}
      {modal === 'billing' && (
        <div className='fixed inset-0 z-[999] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm'>
          <div className='bg-surface-container-lowest w-full max-w-[420px] rounded-xl shadow-xl border border-outline-variant overflow-hidden'>
            <div className='bg-error px-6 py-5 flex flex-col items-center text-center'>
              <div className='w-14 h-14 bg-on-error rounded-full flex items-center justify-center mb-3'>
                <span className='material-symbols-outlined text-error text-[28px]'>block</span>
              </div>
              <h2 className='font-hanken text-xl font-bold text-on-error'>Transaction Restricted</h2>
            </div>
            <div className='p-6 text-center'>
              <p className='text-sm text-on-surface font-medium leading-relaxed'>{userData && userData.billingMessage ? userData.billingMessage : 'Your account has been restricted. Please contact support.'}</p>
              <button onClick={closeModal} className='mt-6 w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95'>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}