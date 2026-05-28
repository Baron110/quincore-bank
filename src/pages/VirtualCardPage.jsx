import React, { useState } from "react";
import { useUserData } from "../hooks/useUserData";
import { auth } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";
import { fmt } from "../utils";

export default function VirtualCardPage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);
  const [showNumber, setShowNumber] = useState(false);
  const [showCvv,    setShowCvv]    = useState(false);
  const [copied,     setCopied]     = useState(false);

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
      </div>
    );
  }

  const card = userData.issuedCard || {};
  const sym  = userData.currencySymbol || "$";
  const fullNumber = `${card.cardNumber?.replace(/\*/g,"8").slice(0,4)} ${card.cardNumber?.replace(/\*/g,"8").slice(5,9)} ${card.cardNumber?.replace(/\*/g,"8").slice(10,14)} ${userData.pin?.slice(-4).padStart(4,"0")}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullNumber).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24 md:pb-lg">
        <Header title="Virtual Card" userData={userData} />
        <div className="px-gutter py-lg max-w-4xl mx-auto space-y-lg">
          <div>
            <h2 className="font-hanken text-headline-lg text-primary">Virtual Card</h2>
            <p className="font-body-md text-on-surface-variant">Manage your secure digital payment methods.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
            {/* Card Visual */}
            <div className="lg:col-span-7 space-y-md">
              <div className="relative w-full aspect-[1.586/1] rounded-xl bg-primary-container card-texture p-md md:p-lg flex flex-col justify-between text-on-primary shadow-lg overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-secondary-fixed/10 rounded-full blur-2xl" />
                {/* Top */}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col gap-xs">
                    <span className="font-label-sm tracking-widest uppercase opacity-80">QuinCore {userData.accountType}</span>
                    <div className="w-12 h-10 bg-gradient-to-br from-tertiary-fixed to-on-tertiary-container rounded-lg opacity-80 flex items-center justify-center">
                      <div className="w-8 h-6 border border-primary-container/20 rounded-sm" />
                    </div>
                  </div>
                  <span className="font-hanken text-headline-md opacity-30 italic">{card.network || "VISA"}</span>
                </div>
                {/* Number */}
                <div className="relative z-10 text-xl md:text-2xl tracking-[0.2em] font-hanken">
                  {showNumber ? fullNumber : card.cardNumber || "**** **** **** 0000"}
                </div>
                {/* Bottom */}
                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-xs opacity-70 uppercase tracking-wider">Card Holder</p>
                    <p className="font-label-md uppercase">{card.cardHolder || userData.fullName}</p>
                  </div>
                  <div className="flex gap-lg">
                    <div><p className="text-xs opacity-70">Expires</p><p className="font-label-md">{card.expiry || "12/27"}</p></div>
                    <div><p className="text-xs opacity-70">CVV</p><p className="font-label-md">{showCvv ? card.cvv : "•••"}</p></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-sm">
                <button onClick={() => setShowNumber(v => !v)}
                  className="flex-1 min-w-[140px] bg-primary text-on-primary py-sm px-md rounded-xl font-label-md flex items-center justify-center gap-xs active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">{showNumber ? "visibility_off" : "visibility"}</span>
                  {showNumber ? "Hide" : "Reveal"} Number
                </button>
                <button onClick={() => setShowCvv(v => !v)}
                  className="flex-1 min-w-[140px] border border-outline text-primary py-sm px-md rounded-xl font-label-md flex items-center justify-center gap-xs active:scale-95 transition-transform hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[20px]">lock_open</span>
                  {showCvv ? "Hide" : "Show"} CVV
                </button>
                <button onClick={handleCopy}
                  className="flex-1 min-w-[140px] border border-outline text-primary py-sm px-md rounded-xl font-label-md flex items-center justify-center gap-xs active:scale-95 transition-transform hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[20px]">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied!" : "Copy Details"}
                </button>
              </div>
            </div>

            {/* Card Info */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-md">
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant space-y-xs">
                <p className="font-label-sm text-on-surface-variant">Issuer</p>
                <p className="font-label-md text-primary">QuinCore Global</p>
              </div>
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant space-y-xs">
                <p className="font-label-sm text-on-surface-variant">Type</p>
                <p className="font-label-md text-primary">Virtual Debit</p>
              </div>
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant col-span-2 space-y-xs">
                <p className="font-label-sm text-on-surface-variant">Spending Limit</p>
                <div className="flex justify-between items-center">
                  <p className="font-label-md text-primary">{fmt(card.limit || 5000, sym)} / mo</p>
                  <span className="font-label-sm text-secondary-container bg-primary-container px-sm py-xs rounded-full">
                    {Math.round(((card.limit || 5000 - userData.balance) / (card.limit || 5000)) * 100)}% available
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-sm">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: "18%" }} />
                </div>
              </div>
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant col-span-2 flex justify-between items-center">
                <div>
                  <p className="font-label-sm text-on-surface-variant">Status</p>
                  <p className="font-label-md text-primary">Active & Secure</p>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-label-sm text-on-surface-variant">Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Controls */}
          <section>
            <h3 className="font-hanken text-headline-md text-primary mb-md">Card Controls</h3>
            <div className="space-y-sm">
              {[
                { icon: "payments",  label: "Online Transactions",     sub: "Enable for web purchases",         enabled: true  },
                { icon: "public",    label: "International Payments",   sub: "Allow transactions outside home",   enabled: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-md bg-surface-container-lowest rounded-xl border border-outline-variant">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-label-md text-primary">{item.label}</p>
                      <p className="font-body-sm text-on-surface-variant">{item.sub}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative p-xs cursor-pointer transition-colors ${item.enabled ? "bg-primary" : "bg-surface-container-high"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-all ${item.enabled ? "right-1" : "left-1"}`} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-md bg-surface-container-lowest rounded-xl border border-outline-variant">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-lg bg-error-container/20 flex items-center justify-center text-error">
                    <span className="material-symbols-outlined">block</span>
                  </div>
                  <div>
                    <p className="font-label-md text-error">Freeze Card</p>
                    <p className="font-body-sm text-on-surface-variant">Temporarily disable all usage</p>
                  </div>
                </div>
                <button className="font-label-sm text-error font-bold uppercase tracking-wider hover:underline">Freeze</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
