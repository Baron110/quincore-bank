import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useUserData(uid) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { 
      setLoading(false); 
      setUserData(null);
      return; 
    }
    const unsub = onSnapshot(
      doc(db, "users", uid), 
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setUserData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
        setUserData(null);
      }
    );
    return () => unsub();
  }, [uid]);

  return { userData, loading };
}