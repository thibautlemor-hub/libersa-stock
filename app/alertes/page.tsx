"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../../components/NavBar";
import { supabase } from "../../lib/supabase";

type AlertRow = {
  id: string;
  quantity: number;
  articles: {
    name: string;
    min_threshold: number;
  } | null;
  locations: {
    name: string;
  } | null;
};

export default function AlertesPage() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    const { data, error } = await supabase
      .from("stock_levels")
      .select(`
        id,
        quantity,
        articles(name, min_threshold),
        locations(name)
      `)
      .order("quantity", { ascending: true });

    if (error) {
      console.error("Erreur alertes :", error);
      setRows([]);
    } else {
      setRows((data as AlertRow[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const alerts = useMemo(() => {
    return rows.filter((row) => {
      const threshold = Number(row.articles?.min_threshold ?? 0);
      const quantity = Number(row.quantity ?? 0);
      return quantity < threshold;
    });
  }, [rows]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Alertes</h1>
          <p className="mt-2 text-sm text-slate-200">
            Articles sous le seuil minimum
          </p>
        </div>

        <NavBar />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Stock bas</h2>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <p className="text-slate-500">Chargement...</p>
          ) : alerts.length === 0 ? (
            <p className="text-slate-500">Aucune alerte pour le moment.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {alerts.map((row) => {
                const threshold = Number(row.articles?.min_threshold ?? 0);
                const quantity = Number(row.quantity ?? 0);

                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-red-200 bg-red-50 p-4"
                  >
                    <p className="text-lg font-semibold">
                      {row.articles?.name || "Article inconnu"}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">Emplacement</p>
                    <p className="font-medium">
                      {row.locations?.name || "Non défini"}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm">
                      <p>
                        <span className="font-medium">Stock actuel :</span>{" "}
                        {quantity}
                      </p>
                      <p>
                        <span className="font-medium">Seuil mini :</span>{" "}
                        {threshold}
                      </p>
                      <p className="font-semibold text-red-700">
                        Manque : {threshold - quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}