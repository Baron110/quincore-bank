import React from "react";
import { useUserData } from "../hooks/useUserData";
import { auth } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";
import { fmt } from "../utils";

export default function AnalyticsPage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const txns = userData.transactions || [];
  const sym  = userData.currencySymbol || "$";

  const totalIncome   = txns.filter(t => ["received","deposit"].includes(t.type)).reduce((s,t)=>s+t.amount,0);
  const totalExpenses = txns.filter(t => ["sent","bill"].includes(t.type)).reduce((s,t)=>s+t.amount,0);
  const savings       = Math.max(0, totalIncome - totalExpenses);
  const creditScore   = Math.min(850, 600 + Math.floor(userData.balance / 100) + txns.filter(t=>t.status==="Completed").length * 2);

  // 6-month bar data
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleDateString("en-US", { month: "short" }), month: d.getMonth(), year: d.getFullYear() };
  });
  const barHeights = last6.map(({ month, year }) => {
    const total = txns.filter(t => {
      const td = new Date(t.date); return td.getMonth() === month && td.getFullYear() === year && ["sent","bill"].includes(t.type);
    }).reduce((s,t)=>s+t.amount,0);
    return total;
  });
  const maxBar = Math.max(...barHeights, 1);

  // Category breakdown
  const cats = [
    { label: "Transfers",    types: ["sent","received"],           color: "bg-primary" },
    { label: "Deposits",     types: ["deposit"],                   color: "bg-secondary-fixed-dim" },
    { label: "Bills",        types: ["bill"],                      color: "bg-tertiary-fixed" },
    { label: "Requests",     types: ["request","request_received"],color: "bg-surface-variant" },
  ];
  const catTotals = cats.map(c => txns.filter(t=>c.types.includes(t.type)).reduce((s,t)=>s+t.amount,0));
  const catGrand  = Math.max(catTotals.reduce((a,b)=>a+b,0), 1);

  const metrics = [
    { label: "Total Income",    value: fmt(totalIncome, sym),   trend: "+", color: "text-green-600" },
    { label: "Total Expenses",  value: fmt(totalExpenses, sym), trend: "+", color: "text-error" },
    { label: "Savings",         value: fmt(savings, sym),       trend: "+", color: "text-green-600" },
    { label: "Credit Score",    value: String(creditScore),     trend: "–", color: creditScore >= 750 ? "text-green-600" : "text-amber-600" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24 md:pb-lg">
        <Header title="Analytics" userData={userData} />
        <div className="px-gutter py-lg max-w-container-max mx-auto space-y-lg">

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            {metrics.map((m) => (
              <div key={m.label} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col gap-xs">
                <span className="text-on-surface-variant font-label-md uppercase tracking-wider text-xs">{m.label}</span>
                <div className="flex items-end justify-between mt-1">
                  <span className="font-hanken text-headline-md text-primary">{m.value}</span>
                  <span className={`${m.color} text-xs flex items-center font-bold`}>
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            {/* Bar Chart */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
              <div className="flex justify-between items-center mb-lg">
                <h3 className="font-hanken text-headline-md text-primary">Spending Trend</h3>
                <div className="flex items-center gap-sm bg-surface-container-low px-sm py-xs rounded-lg">
                  <span className="font-label-md text-on-surface-variant">Last 6 Months</span>
                  <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                </div>
              </div>
              <div className="relative h-64 flex items-end justify-between gap-md px-md">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                  {[0,1,2,3].map(i => <div key={i} className="border-b border-outline-variant w-full opacity-30" />)}
                </div>
                {last6.map(({ label }, i) => {
                  const h = barHeights[i];
                  const pct = Math.max(4, Math.round((h / maxBar) * 100));
                  const isMax = h === maxBar;
                  return (
                    <div key={label} className="relative group flex flex-col items-center flex-grow">
                      <div
                        className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 ${isMax ? "bg-primary" : "bg-primary-container/30 group-hover:bg-primary-container/50"}`}
                        style={{ height: `${pct}%` }}
                      />
                      <span className="mt-sm font-label-sm text-on-surface-variant">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Donut */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col">
              <h3 className="font-hanken text-headline-md text-primary mb-lg">By Category</h3>
              <div className="flex-grow flex items-center justify-center py-4">
                <div className="w-36 h-36 rounded-full border-[14px] border-primary flex items-center justify-center relative">
                  <div className="absolute -inset-[14px] rounded-full border-[14px] border-secondary-fixed-dim border-l-transparent border-t-transparent transform -rotate-45 w-36 h-36" />
                  <div className="text-center">
                    <span className="block font-hanken font-bold text-lg">{fmt(totalExpenses, sym)}</span>
                    <span className="font-label-sm text-on-surface-variant">Total Spend</span>
                  </div>
                </div>
              </div>
              <div className="space-y-sm mt-lg">
                {cats.map((cat, i) => (
                  <div key={cat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                      <span className="font-body-sm text-on-surface">{cat.label}</span>
                    </div>
                    <span className="font-label-md text-primary">
                      {catGrand > 0 ? Math.round((catTotals[i] / catGrand) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Banner */}
          <div className="bg-primary text-on-primary p-lg rounded-xl flex flex-col md:flex-row items-center justify-between gap-lg">
            <div className="flex-grow">
              <h4 className="font-hanken text-headline-md mb-xs">Financial Insight</h4>
              <p className="font-body-md text-on-primary-container">
                Your account balance is <strong className="text-secondary-fixed">{fmt(userData.balance, sym)}</strong>. 
                Keep tracking your expenses to hit your savings goals faster.
              </p>
            </div>
            <button className="bg-secondary-fixed text-on-secondary-fixed px-lg py-md rounded-lg font-label-md hover:bg-secondary-fixed-dim transition-colors whitespace-nowrap active:scale-95">
              View Full Report
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
