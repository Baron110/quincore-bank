import React, { useState, useRef, useEffect } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useUserData } from "../hooks/useUserData";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import Header from "../components/Header";

export default function MessagesPage() {
  const uid = auth.currentUser?.uid;
  const { userData, loading } = useUserData(uid); // already live via onSnapshot
  const [input,   setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const messages = userData?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading || !userData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
    </div>
  );

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        messages: arrayUnion({ sender: "user", text: input.trim(), timestamp: new Date().toISOString() })
      });
      setInput("");
    } finally { setSending(false); }
  };

  return (
    <div className="bg-background min-h-screen">
      <Sidebar userData={userData} />
      <MobileNav />
      <div className="md:ml-64 min-h-screen pb-24 flex flex-col">
        <Header title="Support Chat" userData={userData} />

        <div className="max-w-lg w-full mx-auto px-4 py-6 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 min-h-[50vh]">
            {messages.length === 0 ? (
              <div className="m-auto text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-5xl">forum</span>
                <p className="text-sm font-semibold text-on-surface-variant mt-2">No messages yet</p>
                <p className="text-xs text-on-surface-variant mt-1">Send a message and our team will get back to you here.</p>
              </div>
            ) : messages.map((m, i) => (
              <div key={i}
                className={`max-w-[80%] rounded-xl px-3 py-2 ${m.sender === "user" ? "bg-primary text-on-primary self-end" : "bg-surface-container-low border border-outline-variant text-primary self-start"}`}>
                {m.sender === "admin" && (
                  <p className="text-[10px] font-bold opacity-70 mb-0.5">{m.senderLabel || "QuinCore Support"}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.sender === "user" ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                  {m.timestamp ? new Date(m.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                </p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 mt-4">
            <input
              className="flex-1 px-3 py-3 rounded-lg border border-outline-variant focus:outline-none focus:border-primary bg-white text-sm"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !sending) handleSend(); }} />
            <button onClick={handleSend} disabled={sending || !input.trim()}
              className="px-5 bg-primary text-on-primary rounded-lg disabled:opacity-60 flex items-center justify-center active:scale-95">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}