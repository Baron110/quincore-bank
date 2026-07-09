import React, { useState, useRef } from "react";
import { auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";
import { fmt } from "../utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function StatementPage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);
  const statementRef = useRef(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );

  const sym = userData.currencySymbol || "$";
  const allTxns = userData.transactions || [];

  // Filter transactions to the selected month/year, oldest first for a statement feel
  const monthTxns = allTxns
    .filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const moneyIn  = monthTxns.filter(t => ["received","deposit"].includes(t.type)).reduce((s,t) => s + Number(t.amount || 0), 0);
  const moneyOut = monthTxns.filter(t => ["sent","bill"].includes(t.type)).reduce((s,t) => s + Number(t.amount || 0), 0);

  // Approximate opening balance by walking the current balance backward
  // through everything that happened AFTER the selected period.
  const laterTxns = allTxns.filter(tx => new Date(tx.date) > new Date(year, month + 1, 0));
  const laterNet  = laterTxns.reduce((s, t) => {
    if (["received","deposit"].includes(t.type)) return s - Number(t.amount || 0);
    if (["sent","bill"].includes(t.type))         return s + Number(t.amount || 0);
    return s;
  }, 0);
  const closingBalance = (userData.balance || 0) + laterNet;
  const openingBalance = closingBalance - moneyIn + moneyOut;

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF }       = await import("jspdf");
      const el     = statementRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`QuinCore_Statement_${MONTHS[month]}_${year}.pdf`);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } finally { setGenerating(false); }
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Statements" userData={userData} />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Period picker */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Statement Period</p>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary bg-white"
                value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                className="w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-primary bg-white"
                value={year} onChange={e => setYear(Number(e.target.value))}>
                {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={handleDownload} disabled={generating}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{generating ? "hourglass_empty" : "download"}</span>
              {generating ? "Generating PDF…" : "Download Statement PDF"}
            </button>
            {downloaded && <p className="text-xs text-green-600 font-bold text-center">✓ Statement downloaded</p>}
          </div>

          {/* Statement preview — this exact box is what gets captured to PDF */}
          <div className="overflow-x-auto">
            <div ref={statementRef} style={{ width: "600px" }} className="bg-white p-8 border border-outline-variant rounded-xl mx-auto">

              {/* Letterhead */}
              <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[28px]">account_balance</span>
                  <div>
                    <p className="font-hanken text-lg font-bold text-primary leading-tight">QuinCore Bank</p>
                    <p className="text-[10px] text-on-surface-variant">Statement of Account</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{MONTHS[month]} {year}</p>
                  <p className="text-[10px] text-on-surface-variant">Generated {now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                </div>
              </div>

              {/* Account holder info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div>
                  <p className="text-on-surface-variant">Account Holder</p>
                  <p className="font-bold text-primary">{userData.fullName}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Account Number</p>
                  <p className="font-bold text-primary font-mono">{userData.accountNumber}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Account Type</p>
                  <p className="font-bold text-primary">{userData.accountType}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Currency</p>
                  <p className="font-bold text-primary">{userData.currency}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase">Opening Balance</p>
                  <p className="text-sm font-bold text-primary">{fmt(openingBalance, sym)}</p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <p className="text-[10px] text-on-surface-variant uppercase">Closing Balance</p>
                  <p className="text-sm font-bold text-primary">{fmt(closingBalance, sym)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-[10px] text-green-700 uppercase">Total Money In</p>
                  <p className="text-sm font-bold text-green-700">+{fmt(moneyIn, sym)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-[10px] text-error uppercase">Total Money Out</p>
                  <p className="text-sm font-bold text-error">-{fmt(moneyOut, sym)}</p>
                </div>
              </div>

              {/* Transaction list */}
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Transaction History</p>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="py-2 text-[10px] font-bold text-on-surface-variant uppercase">Date</th>
                    <th className="py-2 text-[10px] font-bold text-on-surface-variant uppercase">Description</th>
                    <th className="py-2 text-[10px] font-bold text-on-surface-variant uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthTxns.length === 0 ? (
                    <tr><td colSpan={3} className="py-6 text-center text-xs text-on-surface-variant">No transactions this period</td></tr>
                  ) : monthTxns.map(tx => {
                    const isIn = ["received","deposit"].includes(tx.type);
                    return (
                      <tr key={tx.id} className="border-b border-outline-variant/30">
                        <td className="py-2 text-[11px] text-on-surface-variant whitespace-nowrap">{tx.date}</td>
                        <td className="py-2 text-[11px] text-primary">{tx.description}</td>
                        <td className={`py-2 text-[11px] font-bold text-right whitespace-nowrap ${isIn ? "text-green-700" : "text-error"}`}>
                          {isIn ? "+" : "-"}{fmt(tx.amount, sym)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-outline-variant text-center">
                <p className="text-[9px] text-on-surface-variant">This is a computer-generated statement and does not require a signature.</p>
                <p className="text-[9px] text-on-surface-variant">QuinCore Bank · quincore.online</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}