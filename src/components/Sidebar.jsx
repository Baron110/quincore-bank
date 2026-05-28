import React from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard",     icon: "dashboard",    label: "Dashboard" },
  { path: "/transactions",  icon: "receipt_long", label: "Transactions" },
  { path: "/virtual-card",  icon: "credit_card",  label: "Virtual Card" },
  { path: "/analytics",     icon: "monitoring",   label: "Analytics" },
  { path: "/profile",       icon: "person",       label: "Profile" },
];

export default function Sidebar({ userData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-primary border-r border-outline-variant py-lg px-md z-40">
      {/* Logo */}
      <div className="mb-xl">
        <h1 className="font-hanken text-headline-md text-on-primary">QuinCore Bank</h1>
        <p className="font-label-md text-label-md text-on-primary-container opacity-80">
          {userData?.accountType || "Premium"} Member
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-base">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-sm px-md py-sm rounded-lg transition-all duration-200 active:scale-95 ${
              isActive(item.path)
                ? "text-on-primary bg-primary-container/30 border-r-4 border-secondary-fixed"
                : "text-on-primary-container hover:bg-primary-container/50"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-sm px-md py-sm rounded-lg text-on-primary-container hover:bg-primary-container/50 transition-all duration-200 active:scale-95 w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
