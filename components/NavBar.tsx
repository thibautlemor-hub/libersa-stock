"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import PwaInstaller from "./PwaInstaller";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/articles", label: "Articles" },
  { href: "/entrees-stock", label: "Entrées stock" },
  { href: "/transferts", label: "Transferts" },
  { href: "/sorties-chantier", label: "Sorties chantier" },
  { href: "/stock", label: "Stock" },
  { href: "/historique", label: "Historique" },
  { href: "/alertes", label: "Alertes" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <nav className="flex flex-wrap gap-3">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <PwaInstaller />

        <button
          onClick={handleLogout}
          className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}