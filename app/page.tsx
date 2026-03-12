"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "../components/NavBar";
import { supabase } from "../lib/supabase";

type StockAlertRow = {
  quantity: number;
  articles: {
    min_threshold: number;
  } | null;
};

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [articleCount, setArticleCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function initPage() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { count: articles } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true });

      const { count: locations } = await supabase
        .from("locations")
        .select("*", { count: "exact", head: true });

      const { count: stock } = await supabase
        .from("stock_levels")
        .select("*", { count: "exact", head: true });

      const { data: stockRows, error: alertError } = await supabase
        .from("stock_levels")
        .select(`
          quantity,
          articles(min_threshold)
        `);

      let computedAlerts = 0;

      if (!alertError && stockRows) {
        computedAlerts = (stockRows as StockAlertRow[]).filter((row) => {
          const qty = Number(row.quantity ?? 0);
          const threshold = Number(row.articles?.min_threshold ?? 0);
          return qty < threshold;
        }).length;
      }

      setArticleCount(articles || 0);
      setLocationCount(locations || 0);
      setStockCount(stock || 0);
      setAlertCount(computedAlerts);
      setCheckingAuth(false);
    }

    initPage();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold md:text-4xl">Libersa Stock</h1>
          <p className="mt-2 text-sm text-slate-200 md:text-base">
            Tableau de bord de gestion du stock
          </p>
        </div>

        <NavBar />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Articles</p>
            <p className="mt-2 text-3xl font-bold">{articleCount}</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Emplacements</p>
            <p className="mt-2 text-3xl font-bold">{locationCount}</p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Lignes de stock</p>
            <p className="mt-2 text-3xl font-bold">{stockCount}</p>
          </div>

          <div className="rounded-3xl bg-red-50 p-6 shadow-sm ring-1 ring-red-200">
            <p className="text-sm text-red-600">Alertes stock bas</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{alertCount}</p>
          </div>
        </div>
      </div>
    </main>
  );
}