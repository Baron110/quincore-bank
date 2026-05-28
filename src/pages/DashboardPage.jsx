import React, { useState } from "react";
import { Link } from "react-router-dom";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";
import { fmt, generateTxnId, nowDateTime, TXN_META } from "../utils";

// ─── EmailJS Config ───────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-[520px] rounded-xl shadow-xl border border-outline-variant overflow-hidden">
        <div className="p-md flex justify-between items-center border-b border-outline-variant/30">
          <h2 className="font-hanken text-headline-md text-primary">{title}</h2>
          <button onClick={onClose} className="material-symbols-outlined text-on-surface-variant active:scale-95">close</button>
        </div>
        <div className="p-lg space-y-md">
          {success ? (
            <div className="text-center py-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-md">
                <span className="material-symbols-outlined text-green-600" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <p className="font-hanken text-headline-md text-primary">{success}</p>
            </div>
          ) : (
            <>
              {children}
              <div className="flex gap-md pt-xs">
                <button onClick={onClose} className="flex-1 border border-outline-variant py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={onSubmit} disabled={loading}
                  className="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-md active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-sm">
                  {loading
                    ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Processing…</>
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
      <label className="font-label-md text-label-md text-primary block mb-xs">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-md py-sm rounded-lg border border-outline-variant font-body-sm focus:outline-none focus:border-primary transition-colors bg-white";

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);

  const [modal,        setModal]        = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError,   setModalError]   = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [sendForm,    setSendForm]    = useState({ recipientEmail: "", amount: "", purpose: "" });
  const [depositAmt,  setDepositAmt]  = useState("");
  const [requestForm, setRequestForm] = useState({ recipientEmail: "", amount: "", note: "" });
  const [billForm,    setBillForm]    = useState({ billType: "", amount: "", ref: "" });

  const openModal = (name) => {
    setModal(name); setModalError(""); setModalSuccess("");
    setSendForm({ recipientEmail: "", amount: "", purpose: "" });
    setDepositAmt("");
    setRequestForm({ recipientEmail: "", amount: "", note: "" });
    setBillForm({ billType: "", amount: "", ref: "" });
  };
  const closeModal = () => { setModal(null); setModalError(""); setModalSuccess(""); };

  const addTxn = async (targetUid, txn, delta) => {
    const ref  = doc(db, "users", targetUid);
    const snap = await getDoc(ref);
    await updateDoc(ref, { balance: snap.data().balance + delta, transactions: arrayUnion(txn) });
  };

  // ── Send Money ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const amount = parseFloat(sendForm.amount);
    if (!sendForm.recipientEmail || !amount || amount <= 0) { setModalError("Fill all fields."); return; }
    if (sendForm.recipientEmail.toLowerCase() === userData.email) { setModalError("Cannot send to yourself."); return; }
    if (amount > userData.balance) { setModalError("Insufficient balance."); return; }
    setModalLoading(true); setModalError("");
    try {
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const q    = query(collection(db, "users"), where("email", "==", sendForm.recipientEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      const ts   = nowDateTime();
      const id   = generateTxnId();
      const sym  = userData.currencySymbol || "$";

      await addTxn(uid, {
        id, type: "sent", amount,
        description: `Sent to ${sendForm.recipientEmail}`,
        purpose: sendForm.purpose || "Transfer",
        ...ts, status: "Completed", category: "Transfer",
        icon: TXN_META.sent.icon, color: TXN_META.sent.color,
      }, -amount);

      // Email to sender
      await sendTransactionEmail({
        to_email:         userData.email,
        recipient_name:   userData.firstName,
        subject:          `You sent ${fmt(amount, sym)}`,
        message:          `You successfully sent ${fmt(amount, sym)} to ${sendForm.recipientEmail}. Purpose: ${sendForm.purpose || "Transfer"}.`,
        transaction_type: "💸 Debit",
        amount:           fmt(amount, sym),
        date:             ts.date,
        transaction_id:   id,
        new_balance:      fmt(userData.balance - amount, sym),
        footer_note:      "If you did not authorize this transaction, contact support immediately.",
      });

      if (!snap.empty) {
        const recipientDoc  = snap.docs[0];
        const recipientData = recipientDoc.data();
        await addTxn(recipientDoc.id, {
          id: generateTxnId(), type: "received", amount,
          description: `Received from ${userData.email}`,
          ...ts, status: "Completed", category: "Transfer",
          icon: TXN_META.received.icon, color: TXN_META.received.color,
        }, amount);

        // Email to recipient
        await sendTransactionEmail({
          to_email:         sendForm.recipientEmail,
          recipient_name:   recipientData.firstName || "there",
          subject:          `You received ${fmt(amount, sym)}`,
          message:          `Great news! You received ${fmt(amount, sym)} from ${userData.email}.`,
          transaction_type: "💰 Credit",
          amount:           fmt(amount, sym),
          date:             ts.date,
          transaction_id:   generateTxnId(),
          new_balance:      fmt(recipientData.balance + amount, sym),
          footer_note:      "Log in to your QuinCore account to view full details.",
        });
      }

      setModalSuccess(`${fmt(amount, userData.currencySymbol)} sent successfully!`);
      setTimeout(closeModal, 2000);
    } catch (e) { setModalError(e.message); }
    finally { setModalLoading(false); }
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
        id, type: "deposit", amount,
        description: "Manual deposit",
        ...ts, status: "Completed", category: "Income",
        icon: TXN_META.deposit.icon, color: TXN_META.deposit.color,
      }, amount);

      await sendTransactionEmail({
        to_email:         userData.email,
        recipient_name:   userData.firstName,
        subject:          `Deposit Confirmed — ${fmt(amount, sym)}`,
        message:          `Your deposit of ${fmt(amount, sym)} into your QuinCore account was successful.`,
        transaction_type: "💰 Credit",
        amount:           fmt(amount, sym),
        date:             ts.date,
        transaction_id:   id,
        new_balance:      fmt(userData.balance + amount, sym),
        footer_note:      "Thank you for banking with QuinCore.",
      });

      setModalSuccess(`${fmt(amount, userData.currencySymbol)} deposited!`);
      setTimeout(closeModal, 2000);
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
      setModalSuccess("Money request sent!");
      setTimeout(closeModal, 2000);
    } catch (e) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  // ── Pay Bill ────────────────────────────────────────────────────────────────
  const handleBill = async () => {
    const amount = parseFloat(billForm.amount);
    if (!billForm.billType || isNaN(amount) || amount <= 0) { setModalError("Fill all fields."); return; }
    if (amount > userData.balance) { setModalError("Insufficient balance."); return; }
    setModalLoading(true); setModalError("");
    try {
      const ts  = nowDateTime();
      const sym = userData.currencySymbol || "$";
      const id  = generateTxnId();
      await addTxn(uid, {
        id, type: "bill", amount,
        description: `${billForm.billType} bill payment`,
        accountRef: billForm.ref, ...ts, status: "Completed", category: "Bills",
        icon: TXN_META.bill.icon, color: TXN_META.bill.color,
      }, -amount);

      await sendTransactionEmail({
        to_email:         userData.email,
        recipient_name:   userData.firstName,
        subject:          `Bill Payment Confirmed — ${fmt(amount, sym)}`,
        message:          `Your ${billForm.billType} bill payment of ${fmt(amount, sym)} has been processed successfully.`,
        transaction_type: "🧾 Bill Payment",
        amount:           fmt(amount, sym),
        date:             ts.date,
        transaction_id:   id,
        new_balance:      fmt(userData.balance - amount, sym),
        footer_note:      "If you did not make this payment, contact support immediately.",
      });

      setModalSuccess(`${billForm.billType} bill of ${fmt(amount, userData.currencySymbol)} paid!`);
      setTimeout(closeModal, 2000);
    } catch (e) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  // ── Loading / No Data ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="font-label-md text-on-surface-variant mt-4">Loading your account…</p>
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

  const recentTxns  = [...(userData.transactions || [])].reverse().slice(0, 3);
  const sym         = userData.currencySymbol || "$";
  const totalSpent  = (userData.transactions || []).filter(t => ["sent","bill"].includes(t.type)).reduce((s,t) => s + t.amount, 0);
  const totalReceived = (userData.transactions || []).filter(t => ["received","deposit"].includes(t.type)).reduce((s,t) => s + t.amount, 0);
  const savingsRate = totalReceived > 0 ? Math.max(0, Math.round(((totalReceived - totalSpent) / totalReceived) * 100)) : 0;

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
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="font-label-md text-on-primary-container">Available Balance</p>
                  <h2 className="font-hanken text-headline-xl mt-xs">{fmt(userData.balance, sym)}</h2>
                </div>
                <div className="bg-secondary-fixed text-on-secondary-fixed px-sm py-xs rounded-lg font-label-md flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {userData.accountType?.toUpperCase()} TIER
                </div>
              </div>
              <div className="relative z-10 flex justify-between items-end mt-xl">
                <div>
                  <p className="font-label-sm text-on-primary-container tracking-widest uppercase">Account Number</p>
                  <p className="font-body-md mt-xs">{userData.accountNumber}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined">contactless</span>
                </div>
              </div>
            </section>

            <section className="lg:col-span-4 flex flex-col gap-gutter">
              <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex-grow flex flex-col justify-center">
                <p className="font-label-sm text-on-surface-variant uppercase">Total Spent (Month)</p>
                <div className="flex items-baseline gap-xs mt-base">
                  <h3 className="font-hanken text-headline-md">{fmt(totalSpent, sym)}</h3>
                  <span className="text-error font-label-sm flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex-grow flex flex-col justify-center">
                <p className="font-label-sm text-on-surface-variant uppercase">Total Received</p>
                <div className="flex items-baseline gap-xs mt-base">
                  <h3 className="font-hanken text-headline-md">{fmt(totalReceived, sym)}</h3>
                  <span className="text-primary font-label-sm flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ── Quick Actions ── */}
          <section>
            <h3 className="font-label-md text-on-surface-variant mb-md uppercase tracking-wider">Quick Actions</h3>
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
                  <span className="font-label-md">{q.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Bottom Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-md border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-hanken text-headline-md">Recent Transactions</h3>
                <Link to="/transactions" className="text-primary font-label-md hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-md py-sm font-label-sm text-on-surface-variant">Description</th>
                      <th className="px-md py-sm font-label-sm text-on-surface-variant">Date</th>
                      <th className="px-md py-sm font-label-sm text-on-surface-variant">Amount</th>
                      <th className="px-md py-sm font-label-sm text-on-surface-variant text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {recentTxns.length === 0 ? (
                      <tr><td colSpan={4} className="px-md py-lg text-center font-label-md text-on-surface-variant">No transactions yet</td></tr>
                    ) : recentTxns.map((tx) => {
                      const isIn  = ["received","deposit"].includes(tx.type);
                      const isOut = ["sent","bill"].includes(tx.type);
                      return (
                        <tr key={tx.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-md py-md flex items-center gap-md">
                            <div className={`w-10 h-10 rounded-lg ${tx.color || "bg-secondary-container"} flex items-center justify-center`}>
                              <span className="material-symbols-outlined">{tx.icon || "receipt"}</span>
                            </div>
                            <div>
                              <p className="font-label-md">{tx.description}</p>
                              <p className="font-body-sm text-on-surface-variant">{tx.category}</p>
                            </div>
                          </td>
                          <td className="px-md py-md font-body-sm">{tx.date}</td>
                          <td className={`px-md py-md font-label-md ${isIn ? "text-green-600" : isOut ? "text-error" : "text-primary"}`}>
                            {isIn ? "+" : isOut ? "-" : ""}{fmt(tx.amount, sym)}
                          </td>
                          <td className="px-md py-md text-right">
                            <span className={`px-sm py-xs rounded-full font-label-sm ${tx.status === "Completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
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
                <h3 className="font-label-md text-on-surface-variant mb-md uppercase tracking-wider">Savings Rate</h3>
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-hanken text-headline-md">{savingsRate}%</span>
                  <span className="text-on-surface-variant font-label-sm">Goal: 30%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${Math.min(100, savingsRate)}%` }} />
                </div>
                <p className="mt-md font-body-sm text-on-surface-variant">Keep growing your savings, {userData.firstName}!</p>
              </div>
              <div className="bg-primary-container p-md rounded-xl text-on-primary">
                <h4 className="font-label-md text-on-primary-container mb-sm">Premium Insights</h4>
                <p className="font-body-sm italic">"Track your spending and hit your savings goal faster."</p>
                <Link to="/analytics">
                  <button className="mt-md w-full py-sm bg-secondary-fixed text-on-secondary-fixed rounded-lg font-label-md active:scale-95 transition-transform">
                    Explore Analytics
                  </button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "send" && (
        <Modal title="Send Money" onClose={closeModal} onSubmit={handleSend} loading={modalLoading} submitLabel="Send Money" success={modalSuccess}>
          {modalError && <p className="text-error font-label-sm mb-sm">{modalError}</p>}
          <Field label="Recipient Email">
            <input className={inputCls} type="email" placeholder="friend@email.com"
              value={sendForm.recipientEmail} onChange={e => setSendForm(p => ({ ...p, recipientEmail: e.target.value }))} />
          </Field>
          <Field label={`Amount (${sym})`}>
            <input className={inputCls} type="number" placeholder="0.00"
              value={sendForm.amount} onChange={e => setSendForm(p => ({ ...p, amount: e.target.value }))} />
            <p className="font-label-sm text-on-surface-variant mt-xs">Available: {fmt(userData.balance, sym)}</p>
          </Field>
          <Field label="Purpose (optional)">
            <input className={inputCls} placeholder="e.g. Rent, Lunch…"
              value={sendForm.purpose} onChange={e => setSendForm(p => ({ ...p, purpose: e.target.value }))} />
          </Field>
        </Modal>
      )}

      {modal === "deposit" && (
        <Modal title="Deposit Funds" onClose={closeModal} onSubmit={handleDeposit} loading={modalLoading} submitLabel="Deposit" success={modalSuccess}>
          {modalError && <p className="text-error font-label-sm mb-sm">{modalError}</p>}
          <div className="flex flex-wrap gap-sm mb-md">
            {[100, 500, 1000, 2500, 5000].map(amt => (
              <button key={amt} type="button" onClick={() => setDepositAmt(String(amt))}
                className={`px-md py-xs rounded-full font-label-md border transition-all ${depositAmt === String(amt) ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant"}`}>
                {sym}{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <Field label={`Amount (${sym})`}>
            <input className={inputCls} type="number" placeholder="Enter amount"
              value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
            <p className="font-label-sm text-on-surface-variant mt-xs">Minimum: {sym}10</p>
          </Field>
        </Modal>
      )}

      {modal === "request" && (
        <Modal title="Request Money" onClose={closeModal} onSubmit={handleRequest} loading={modalLoading} submitLabel="Send Request" success={modalSuccess}>
          {modalError && <p className="text-error font-label-sm mb-sm">{modalError}</p>}
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

      {modal === "bill" && (
        <Modal title="Pay Bill" onClose={closeModal} onSubmit={handleBill} loading={modalLoading} submitLabel="Pay Now" success={modalSuccess}>
          {modalError && <p className="text-error font-label-sm mb-sm">{modalError}</p>}
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
            <p className="font-label-sm text-on-surface-variant mt-xs">Available: {fmt(userData.balance, sym)}</p>
          </Field>
          <Field label="Reference (optional)">
            <input className={inputCls} placeholder="Account or reference number"
              value={billForm.ref} onChange={e => setBillForm(p => ({ ...p, ref: e.target.value }))} />
          </Field>
        </Modal>
      )}
    </div>
  );
}