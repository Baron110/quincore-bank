import React, { useState } from "react";
import { useUserData } from "../hooks/useUserData";
import { auth } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";
import { fmt } from "../utils";

const FILTERS = ["All", "Sent", "Received", "Deposits", "Bills", "Requests"];

export default function TransactionsPage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const sym = userData.currencySymbol || "$";

  const filtered = [...(userData.transactions || [])]
    .reverse()
    .filter(tx => {
      if (filter === "Sent"     && tx.type !== "sent")     return false;
      if (filter === "Received" && tx.type !== "received") return false;
      if (filter === "Deposits" && tx.type !== "deposit")  return false;
      if (filter === "Bills"    && tx.type !== "bill")     return false;
      if (filter === "Requests" && !["request","request_received"].includes(tx.type)) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24 md:pb-lg">
        <Header title="Transactions" userData={userData} />
        <div className="px-gutter py-lg max-w-container-max mx-auto">

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-md mb-lg">
            <div className="flex items-center gap-base p-1 bg-surface-container-low rounded-xl border border-outline-variant/50 overflow-x-auto">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-md py-xs rounded-lg font-label-md whitespace-nowrap transition-all ${filter === f ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-xl px-sm py-xs gap-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 font-body-sm placeholder:text-on-surface-variant/50 outline-none w-48"
                placeholder="Search transactions…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/50">
                    <th className="px-md py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="px-md py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Description</th>
                    <th className="px-md py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Category</th>
                    <th className="px-md py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Amount</th>
                    <th className="px-md py-md font-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-md py-md" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-md py-xl text-center font-label-md text-on-surface-variant">No transactions found</td></tr>
                  ) : filtered.map(tx => {
                    const isIn  = ["received","deposit"].includes(tx.type);
                    const isOut = ["sent","bill"].includes(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer">
                        <td className="px-md py-md font-body-sm text-on-surface-variant">{tx.date}</td>
                        <td className="px-md py-md">
                          <div className="flex items-center gap-sm">
                            <div className={`h-10 w-10 rounded-full ${tx.color || "bg-secondary-container"} flex items-center justify-center flex-shrink-0`}>
                              <span className="material-symbols-outlined">{tx.icon || "receipt"}</span>
                            </div>
                            <div>
                              <p className="font-label-md text-primary">{tx.description}</p>
                              <p className="font-body-sm text-on-surface-variant">{tx.time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-md py-md">
                          <span className="px-sm py-xs bg-surface-container-high text-on-surface-variant rounded-full font-label-sm">{tx.category}</span>
                        </td>
                        <td className={`px-md py-md font-label-md ${isIn ? "text-green-600 font-bold" : isOut ? "text-error" : "text-primary"}`}>
                          {isIn ? "+" : isOut ? "-" : ""}{fmt(tx.amount, sym)}
                        </td>
                        <td className="px-md py-md">
                          <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full font-label-sm ${tx.status === "Completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${tx.status === "Completed" ? "bg-green-600" : "bg-amber-600"}`} />
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-md py-md text-right">
                          <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination hint */}
            <div className="flex items-center justify-between px-md py-md bg-surface-container-lowest border-t border-outline-variant/30">
              <p className="font-body-sm text-on-surface-variant">
                Showing {filtered.length} of {(userData.transactions || []).length} transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
