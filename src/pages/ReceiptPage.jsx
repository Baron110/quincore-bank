import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MobileNav from "../components/MobileNav";

export default function ReceiptPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const receipt = state || {
    amount: "0.00",
    recipientName: "Unknown",
    recipientEmail: "",
    transactionId: "QC-000000000",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: new Date().toLocaleTimeString(),
    type: "Transfer",
    newBalance: "0.00",
    symbol: "$",
  };

const handleDownload = async () => {
  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const element = document.getElementById("receipt-card");
  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`QuinCore_Receipt_${receipt.transactionId}.pdf`);
};

  return (
    <div className="bg-background min-h-screen">
      {/* Top bar */}
      <header className="w-full bg-background border-b border-outline-variant">
        <div className="flex justify-between items-center px-gutter py-md w-full max-w-container-max mx-auto">
          <h1
            className="font-hanken text-headline-md text-primary cursor-pointer"
            onClick={() => navigate("/dashboard")}>
            QuinCore Bank
          </h1>
          <span className="material-symbols-outlined text-primary">notifications</span>
        </div>
      </header>

      {/* Receipt Card */}
      <main className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8 pb-24 md:pb-8">
       <div id="receipt-card" className="w-full max-w-[480px] bg-surface-container-lowest...">

          {/* Green success header */}
          <div className="bg-primary text-on-primary px-lg py-xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mb-md">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: 32, fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <p className="font-label-md text-on-primary-container mb-xs uppercase tracking-wider text-xs">
              Transaction Completed
            </p>
            <h2 className="font-hanken text-4xl font-bold mt-1">
              {receipt.symbol}{receipt.amount}
            </h2>
            <p className="opacity-80 mt-xs text-sm">
              {receipt.type === "deposit"
                ? "Deposit successful to your account"
                : receipt.type === "bill"
                ? `${receipt.recipientName} bill payment successful`
                : `Payment successful to ${receipt.recipientName}`}
            </p>
          </div>

          {/* Details */}
          <div className="p-lg space-y-lg">
            {/* ID + Date row */}
            <div className="grid grid-cols-2 gap-md">
              <div>
                <p className="font-label-sm text-on-surface-variant mb-xs text-xs">Transaction ID</p>
                <p className="font-body-md font-semibold text-primary text-sm">{receipt.transactionId}</p>
              </div>
              <div className="text-right">
                <p className="font-label-sm text-on-surface-variant mb-xs text-xs">Date & Time</p>
                <p className="font-body-md font-semibold text-primary text-sm">{receipt.date} · {receipt.time}</p>
              </div>
            </div>

            <div className="h-px bg-outline-variant w-full" />

            {/* Recipient / Details */}
            <div className="space-y-md">
              <p className="font-label-sm text-on-surface-variant uppercase tracking-tight text-xs">
                {receipt.type === "deposit" ? "Deposit Details" : receipt.type === "bill" ? "Bill Details" : "Recipient Details"}
              </p>
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary">
                    {receipt.type === "deposit" ? "account_balance_wallet" : receipt.type === "bill" ? "receipt_long" : "account_balance"}
                  </span>
                </div>
                <div>
                  <p className="font-body-md font-semibold text-primary">{receipt.recipientName}</p>
                  {receipt.recipientEmail && (
                    <p className="font-body-sm text-on-surface-variant text-xs">{receipt.recipientEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary row */}
            <div className="bg-surface-container-low rounded-xl p-md space-y-2">
              {[
                ["Amount",      `${receipt.symbol}${receipt.amount}`],
                ["Type",        receipt.type],
                ["New Balance", `${receipt.symbol}${receipt.newBalance}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{label}</span>
                  <span className="text-sm font-bold text-primary">{val}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-sm pt-xs">
              <button
                onClick={handleDownload}
                className="w-full h-12 bg-primary text-on-primary font-label-md rounded-lg flex items-center justify-center gap-sm active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Download Receipt
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full h-12 border border-outline text-primary font-label-md rounded-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container-low">
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-surface-container-low py-sm border-t border-outline-variant flex justify-center items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-on-secondary-container">security</span>
            <span className="font-label-sm text-on-secondary-container text-xs">QuinCore Bank — Secured Transaction</span>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
