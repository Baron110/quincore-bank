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

  const handleDownload = () => {
    const content = `
QuinCore Bank — Transaction Receipt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transaction ID : ${receipt.transactionId}
Date & Time    : ${receipt.date} · ${receipt.time}
Type           : ${receipt.type}
Amount         : ${receipt.symbol}${receipt.amount}
Recipient      : ${receipt.recipientName}
${receipt.recipientEmail ? `Email          : ${receipt.recipientEmail}` : ""}
New Balance    : ${receipt.symbol}${receipt.newBalance}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QuinCore Bank — Premium Digital Banking
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `QuinCore_Receipt_${receipt.transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg overflow-hidden">

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
              {receipt.symbol}{parseFloat(receipt.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                ["Amount",         `${receipt.symbol}${parseFloat(receipt.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                ["Type",           receipt.type],
                ...(receipt.paymentMethod ? [["Payment Via", receipt.paymentMethod]] : []),
                ...(receipt.paymentTag    ? [["Tag / Handle", receipt.paymentTag]]   : []),
                ...(receipt.bankName      ? [["Bank", receipt.bankName]]             : []),
                ...(receipt.bankSwift     ? [["SWIFT / BIC", receipt.bankSwift]]     : []),
                ...(receipt.bankAccount   ? [["Account No.", receipt.bankAccount]]   : []),
                ["Date",           receipt.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
                ["Time",           receipt.time || new Date().toLocaleTimeString()],
                ["New Balance",    `${receipt.symbol}${parseFloat(receipt.newBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
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