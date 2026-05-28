import React from "react";
import { Link } from "react-router-dom";

export default function Header({ title, userData }) {
  const initials = userData
    ? `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`
    : "?";

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md flex justify-between items-center px-gutter py-md w-full max-w-container-max mx-auto">
      <div className="flex items-center gap-sm">
        <span className="md:hidden material-symbols-outlined text-primary">menu</span>
        <h2 className="font-hanken text-headline-md text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-md">
        <div className="hidden sm:flex relative items-center bg-surface-container-low px-sm py-xs rounded-full border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant text-body-md">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-sm px-xs w-48 lg:w-64 placeholder:text-on-surface-variant/50 outline-none"
            placeholder="Search transactions..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-sm cursor-pointer active:scale-95 hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary">notifications</span>
        </div>
        <Link
          to="/profile"
          className="h-10 w-10 rounded-full bg-primary flex items-center justify-center overflow-hidden border border-outline-variant text-on-primary font-label-md"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
