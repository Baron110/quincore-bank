import { db } from "./firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "QCB2-";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const seedAdmin2Codes = async () => {
  const codes = Array.from({ length: 20 }, generateCode);
  for (const code of codes) {
    await setDoc(doc(db, "invite_codes_admin2", code), {
      used: false,
      usedBy: "",
      usedAt: "",
      adminGroup: "admin2",
    });
    console.log("Created:", code);
  }
  console.log("All Admin 2 codes created!");
};

seedAdmin2Codes();