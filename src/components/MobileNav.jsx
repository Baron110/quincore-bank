import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard",    icon: "home",         label: "Home" },
  { path: "/transactions", icon: "receipt_long", label: "Txns" },
  { path: "/virtual-card", icon: "credit_card",  label: "Card" },
  { path: "/analytics",    icon: "monitoring",   label: "Analytics" },
  { path: "/profile",      icon: "person",       label: "Profile" },
];

export default function MobileNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-lowest shadow-md border-t border-outline-variant rounded-t-xl">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center justify-center transition-all active:scale-90 ${
            isActive(item.path)
              ? "bg-secondary-container text-on-secondary-container rounded-xl px-4 py-1"
              : "text-on-surface-variant hover:bg-surface-container-low px-2 py-1"
          }`}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="font-label-sm text-label-sm">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
