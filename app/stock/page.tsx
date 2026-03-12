"use client";

import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { supabase } from "../../lib/supabase";

type StockRow = {
  id: string;
  quantity: number;
  articles: {
    name: string;
    brand: string | null;
    reference: string | null;
  } | null;
  locations: {
    name: string;
  } | null;
};

export default function StockPage() {
  const [stock, setStock] = useState<StockRow[]>([]);

  async function loadStock() {
    const { data, error } = await supabase
      .from("stock_levels")
      .select(`
        id,
        quantity,
        articles(name, brand, reference),
        locations(name)
      `)
      .order("quantity", { ascending: false });

    if (!error) {
      setStock((data as StockRow[]) || []);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Stock</h1>
          <p className="mt-2 text-sm text-slate-200">
            Quantités par emplacement
          </p>
        </div>

        <NavBar />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Stock par emplacement</h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stock.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-lg font-semibold">
                  {row.articles?.name || "Article inconnu"}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {row.articles?.brand || "-"}
                  {row.articles?.reference ? ` - ${row.articles.reference}` : ""}
                </p>

                <p className="mt-3 text-sm text-slate-600">Emplacement</p>
                <p className="font-medium">
                  {row.locations?.name || "Non défini"}
                </p>

                <div className="mt-4 inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                  Quantité : {row.quantity}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}