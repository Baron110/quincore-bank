import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

const validateBTCAddress = (addr) => {
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
};

const fmt = (n, sym = "$") =>
  `${sym}${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CryptoPage() {
  const uid       = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid);

  const [btcPrice,    setBtcPrice]    = useState(null);
  const [priceLoading,setPriceLoading]= useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modal,       setModal]       = useState(false);
  const [step,        setStep]        = useState(1);
  const [btcAddress,  setBtcAddress]  = useState("");
  const [amount,      setAmount]      = useState("");
  const [pinInput,    setPinInput]    = useState("");
  const [error,       setError]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [success,     setSuccess]     = useState(null);

  const fetchBTCPrice = useCallback(async () => {
    try {
      const res  = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      const data = await res.json();
      setBtcPrice(data.bitcoin.usd);
      setLastUpdated(new Date());
    } catch { setBtcPrice(null); }
    finally { setPriceLoading(false); }
  }, []);

  useEffect(() => {
    fetchBTCPrice();
    const interval = setInterval(fetchBTCPrice, 3 * 60 * 1000); // every 3 mins
    return () => clearInterval(interval);
  }, [fetchBTCPrice]);

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );

  const sym       = userData.currencySymbol || "$";
  const balance   = userData.balance || 0;
  const btcBalance = btcPrice ? (balance / btcPrice).toFixed(8) : null;
  const amountNum  = parseFloat(amount) || 0;
  const btcAmount  = btcPrice && amountNum > 0 ? (amountNum / btcPrice).toFixed(8) : null;

  const handleSend = async () => {
    if (pinInput !== userData.pin) { setError("Incorrect PIN."); setPinInput(""); return; }
    if (userData?.billingMode) { setError(""); setModal(false); return; }
    setSending(true);
    try {
      const txnId  = `BTC${Date.now()}`;
      const now    = new Date();
      const txn = {
        id:          txnId,
        type:        "sent",
        amount:      amountNum,
        description: `Bitcoin (BTC) Transfer — ${btcAddress.slice(0,10)}...`,
        paymentMethod: "BTC",
        btcAddress,
        btcAmount:   btcAmount,
        btcPrice:    btcPrice,
        date:        now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time:        now.toLocaleTimeString(),
        status:      "Completed",
        category:    "Crypto",
        icon:        "currency_bitcoin",
        color:       "bg-amber-100",
      };
      await updateDoc(doc(db, "users", uid), {
        balance:      balance - amountNum,
        transactions: arrayUnion(txn),
      });
      setSuccess({ txnId, amount: amountNum, btcAmount, btcAddress });
      setModal(false);
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  const openModal = () => {
    setModal(true); setStep(1); setBtcAddress(""); setAmount(""); setPinInput(""); setError("");
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24">
        <Header title="Crypto" userData={userData} />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* BTC Price Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[28px]">currency_bitcoin</span>
                <span className="font-hanken text-lg font-bold">Bitcoin</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">BTC</span>
              </div>
              <button onClick={fetchBTCPrice} className="active:scale-95">
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>
            {priceLoading ? (
              <p className="text-2xl font-bold">Loading…</p>
            ) : btcPrice ? (
              <>
                <p className="text-3xl font-hanken font-bold">${btcPrice.toLocaleString()}</p>
                <p className="text-xs text-white/70 mt-1">
                  {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""} · Updates every 3 min
                </p>
              </>
            ) : (
              <p className="text-sm text-white/70">Price unavailable</p>
            )}
          </div>

          {/* Your BTC Balance */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Your BTC Equivalent</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-hanken text-2xl font-bold text-primary">
                  {btcBalance ? `₿${btcBalance}` : "—"}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  ≈ {fmt(balance, sym)} at current price
                </p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-[28px]">currency_bitcoin</span>
              </div>
            </div>
          </div>

          {/* Send BTC Button */}
          <button onClick={openModal}
            className="w-full bg-amber-500 text-white py-4 rounded-xl text-sm font-bold active:scale-95 flex items-center justify-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-[20px]">send</span>
            Send via Bitcoin (BTC)
          </button>

          {/* Success card */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <p className="text-sm font-bold text-green-700">BTC Transfer Successful!</p>
              </div>
              {[
                ["Amount Sent", fmt(success.amount, sym)],
                ["BTC Amount",  `₿${success.btcAmount}`],
                ["BTC Address", `${success.btcAddress.slice(0,20)}...`],
                ["Transaction", success.txnId],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-green-600">{label}</span>
                  <span className="text-xs font-bold text-green-700">{val}</span>
                </div>
              ))}
            </div>
          )}

          {/* BTC Info */}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">About BTC Transfers</p>
            <p className="text-xs text-on-surface-variant">Bitcoin transfers are irreversible. Always double-check the recipient address before sending. Network fees may apply.</p>
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl border border-outline-variant overflow-hidden">
            <div className="bg-amber-500 text-white px-5 py-4 flex justify-between items-center">
              <p className="font-hanken text-lg font-bold">Send Bitcoin</p>
              <button onClick={() => setModal(false)} className="material-symbols-outlined">close</button>
            </div>

            <div className="p-5 space-y-4">
              {error && <p className="text-error text-xs font-semibold">{error}</p>}

              {step === 1 ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">BTC Address</label>
                    <input
                      className="w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-amber-500 bg-white font-mono"
                      placeholder="bc1q... or 1... or 3..."
                      value={btcAddress}
                      onChange={e => { setBtcAddress(e.target.value); setError(""); }} />
                    {btcAddress && (
                      <p className={`text-xs mt-1 font-semibold ${validateBTCAddress(btcAddress) ? "text-green-600" : "text-error"}`}>
                        {validateBTCAddress(btcAddress) ? "✓ Valid BTC address" : "✗ Invalid BTC address format"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-primary block mb-1 uppercase tracking-wider">Amount ({sym})</label>
                    <input
                      className="w-full px-3 py-3 rounded-lg border border-outline-variant text-sm focus:outline-none focus:border-amber-500 bg-white"
                      type="number" placeholder="0.00"
                      value={amount}
                      onChange={e => { setAmount(e.target.value); setError(""); }} />
                    <p className="text-xs text-on-surface-variant mt-1">Available: {fmt(balance, sym)}</p>
                    {btcAmount && (
                      <p className="text-xs text-amber-600 font-bold mt-1">≈ ₿{btcAmount} at ${btcPrice?.toLocaleString()}/BTC</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!validateBTCAddress(btcAddress)) { setError("Enter a valid BTC address."); return; }
                      if (!amountNum || amountNum <= 0) { setError("Enter a valid amount."); return; }
                      if (amountNum > balance) { setError("Insufficient balance."); return; }
                      setError(""); setStep(2);
                    }}
                    className="w-full bg-amber-500 text-white py-3 rounded-lg text-xs font-bold active:scale-95">
                    Continue →
                  </button>
                </>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Transfer Summary</p>
                    {[
                      ["Amount", fmt(amountNum, sym)],
                      ["BTC Amount", `₿${btcAmount}`],
                      ["BTC Price", `$${btcPrice?.toLocaleString()}`],
                      ["To Address", `${btcAddress.slice(0,16)}...`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-xs text-amber-600">{label}</span>
                        <span className="text-xs font-bold text-amber-800">{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* PIN */}
                  <p className="text-xs font-bold text-primary text-center">Enter PIN to confirm</p>
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: userData.pin?.length || 4 }).map((_, i) => (
                      <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold ${pinInput[i] ? "border-amber-500 bg-amber-500 text-white" : "border-outline-variant"}`}>
                        {pinInput[i] ? "•" : ""}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                    {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((key, i) => (
                      <button key={i} type="button"
                        onClick={() => {
                          if (key === "⌫") { setPinInput(p => p.slice(0,-1)); setError(""); }
                          else if (key !== "" && pinInput.length < (userData.pin?.length || 4)) setPinInput(p => p + String(key));
                        }}
                        className={`h-11 rounded-xl text-sm font-bold active:scale-95 ${key === "" ? "invisible" : key === "⌫" ? "bg-error-container text-on-error-container" : "bg-surface-container-low text-primary border border-outline-variant"}`}>
                        {key}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setStep(1)} className="py-2.5 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant active:scale-95">Back</button>
                    <button onClick={handleSend} disabled={sending || pinInput.length < (userData.pin?.length || 4)}
                      className="py-2.5 bg-amber-500 text-white rounded-lg text-xs font-bold active:scale-95 disabled:opacity-60">
                      {sending ? "Sending…" : "Send BTC"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}