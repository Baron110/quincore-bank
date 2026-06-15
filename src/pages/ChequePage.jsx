import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

// Convert number to words
function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";
  if (num < 0)   return "Negative " + numberToWords(-num);

  let words = "";
  if (Math.floor(num / 1000000) > 0) {
    words += numberToWords(Math.floor(num / 1000000)) + " Million ";
    num %= 1000000;
  }
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) { words += ones[num] + " "; }
    else { words += tens[Math.floor(num / 10)] + " " + ones[num % 10] + " "; }
  }
  return words.trim();
}

function amountInWords(amount) {
  const num    = parseFloat(amount) || 0;
  const dollars = Math.floor(num);
  const cents   = Math.round((num - dollars) * 100);
  let words = numberToWords(dollars) + " Dollars";
  if (cents > 0) words += " and " + numberToWords(cents) + " Cents";
  return words + " Only";
}

// MICR line generator (fake but realistic)
function generateMICR(accountNumber, routing = "021000021") {
  const last8 = (accountNumber || "").replace(/\D/g, "").slice(-8).padStart(8, "0");
  return `⑆${routing}⑆  ${last8}⑈  0001`;
}

export default function ChequePage() {
  const navigate  = useNavigate();
  const uid       = auth.currentUser?.uid;
  const chequeRef = useRef(null);
  const { userData, loading } = useUserData(uid);

  const [form, setForm] = useState({
    payTo:  "",
    amount: "",
    date:   new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    memo:   "",
  });
  const [downloaded, setDownloaded] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleDownload = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF }       = await import("jspdf");
    const el     = chequeRef.current;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 3, canvas.height / 3] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 3, canvas.height / 3);
    pdf.save(`QuinCore_Cheque_${Date.now()}.pdf`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );

  const sym    = userData.currencySymbol || "$";
  const amount = parseFloat(form.amount) || 0;

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Cheque Generator" userData={userData} />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
            <h3 className="font-hanken text-lg font-bold text-primary">Fill in Cheque Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Pay To</label>
                <input
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
                  placeholder="Recipient full name" value={form.payTo} onChange={set("payTo")} />
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Amount ({sym})</label>
                <input
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
                  type="number" placeholder="0.00" value={form.amount} onChange={set("amount")} />
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Date</label>
                <input
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm box-border"
                  type="date" value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: new Date(e.target.value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) }))}
                  style={{ colorScheme: "light" }} />
              </div>
              <div>
                <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Memo / Note</label>
                <input
                  className="w-full px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
                  placeholder="e.g. Rent payment, Invoice #123" value={form.memo} onChange={set("memo")} />
              </div>
            </div>
          </div>

          {/* Cheque Preview */}
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Cheque Preview</p>
            <div className="overflow-x-auto">
              <div
                ref={chequeRef}
                style={{
                  width: "680px",
                  minHeight: "280px",
                  backgroundColor: "#f5f0e8",
                  border: "2px solid #8b7355",
                  borderRadius: "8px",
                  padding: "24px",
                  fontFamily: "Georgia, serif",
                  position: "relative",
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139,115,85,0.08) 28px, rgba(139,115,85,0.08) 29px)",
                }}>

                {/* Top row — bank name + cheque number */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", backgroundColor: "#091426", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: "14px", fontWeight: "bold" }}>Q</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Georgia', serif", fontWeight: "bold", fontSize: "16px", color: "#091426", margin: 0 }}>QuinCore Bank</p>
                        <p style={{ fontSize: "10px", color: "#666", margin: 0 }}>Premium Digital Banking</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "10px", color: "#666", marginTop: "4px" }}>
                      quincore.online · Member FDIC · Est. 2026
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>CHEQUE NO.</p>
                    <p style={{ fontWeight: "bold", fontSize: "14px", color: "#091426", margin: 0 }}>
                      {String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}
                    </p>
                  </div>
                </div>

                {/* Account holder info */}
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontWeight: "bold", fontSize: "13px", color: "#091426", margin: 0 }}>{userData.fullName}</p>
                  <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>{userData.address}</p>
                  <p style={{ fontSize: "11px", color: "#666", margin: 0 }}>{userData.accountNumber}</p>
                </div>

                {/* Date */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#666" }}>DATE: </span>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#091426", borderBottom: "1px solid #8b7355", paddingBottom: "2px", minWidth: "160px", display: "inline-block" }}>
                      {form.date || "___________________"}
                    </span>
                  </div>
                </div>

                {/* Pay to */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>PAY TO THE ORDER OF</span>
                  <span style={{ flex: 1, borderBottom: "1px solid #8b7355", fontSize: "14px", fontWeight: "bold", color: "#091426", paddingBottom: "2px", minHeight: "20px" }}>
                    {form.payTo || ""}
                  </span>
                  <div style={{ border: "1px solid #8b7355", borderRadius: "4px", padding: "2px 8px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "11px", color: "#666" }}>{sym} </span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#091426" }}>
                      {amount > 0 ? amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "__________"}
                    </span>
                  </div>
                </div>

                {/* Amount in words */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <span style={{ flex: 1, borderBottom: "1px solid #8b7355", fontSize: "12px", fontStyle: "italic", color: "#091426", paddingBottom: "2px", minHeight: "20px" }}>
                    {amount > 0 ? amountInWords(amount) : ""}
                  </span>
                  <span style={{ fontSize: "11px", color: "#666", whiteSpace: "nowrap" }}>DOLLARS</span>
                </div>

                {/* Memo + Signature */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "11px", color: "#666" }}>MEMO: </span>
                    <span style={{ fontSize: "11px", borderBottom: "1px solid #8b7355", paddingBottom: "2px", minWidth: "180px", display: "inline-block", color: "#091426" }}>
                      {form.memo || ""}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ borderBottom: "1px solid #8b7355", minWidth: "180px", marginBottom: "2px", height: "24px" }}>
                      <span style={{ fontFamily: "'Georgia', serif", fontSize: "16px", color: "#091426", fontStyle: "italic" }}>
                        {userData.firstName}
                      </span>
                    </div>
                    <p style={{ fontSize: "10px", color: "#666", margin: 0 }}>AUTHORIZED SIGNATURE</p>
                  </div>
                </div>

                {/* MICR Line */}
                <div style={{ borderTop: "1px solid #8b7355", paddingTop: "8px" }}>
                  <p style={{ fontFamily: "Courier New, monospace", fontSize: "13px", color: "#091426", letterSpacing: "2px", margin: 0 }}>
                    {generateMICR(userData.accountNumber)}
                  </p>
                </div>

                {/* Watermark */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%) rotate(-30deg)",
                  fontSize: "48px", fontWeight: "bold", color: "rgba(9,20,38,0.04)",
                  whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none",
                }}>
                  QUINCORE BANK
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleDownload}
              className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-xs font-bold active:scale-95 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">download</span>
              {downloaded ? "Downloaded! ✓" : "Download Cheque PDF"}
            </button>
            <button onClick={() => navigate("/profile")}
              className="flex-1 border border-outline-variant text-on-surface-variant py-3 rounded-lg text-xs font-bold active:scale-95">
              Back to Profile
            </button>
          </div>

          <p className="text-[10px] text-center text-on-surface-variant">
            This cheque is for reference purposes only. No funds are deducted from your account.
          </p>
        </div>
      </div>
    </div>
  );
}