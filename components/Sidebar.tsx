"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";

const navItems = [
  { label: "Dashboard", href: "/day" },
  { label: "History", href: "/history" },
  { label: "Drafts", href: "/drafts" },
  { label: "Trash", href: "/trash" },
  { label: "Account", href: "/account" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 fixed top-0 left-0 right-0 z-50">
        <h1 className="text-lg font-semibold text-gray-800">Weekly Reporting</h1>
        <button onClick={() => setOpen(true)} className="text-2xl text-gray-600">
          <FiMenu />
        </button>
      </div>

      {/* Overlay (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-56 min-h-screen bg-gray-50 border-r border-gray-200
          p-5 flex flex-col transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
        `}
      >
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h1 className="text-base font-semibold text-gray-800">Weekly Reporting</h1>
          <button onClick={() => setOpen(false)} className="text-2xl text-gray-600 md:hidden">
            <FiX />
          </button>
        </div>

        <ul className="space-y-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    active
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => console.log("Logout")}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
        >
          <FiLogOut size={14} />
          Logout
        </button>
      </aside>
    </>
  );
}