"use client";

import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { supabase } from "../../lib/supabase";

type MovementRow = {
  id: string;
  movement_type: string;
  quantity: number;
  created_at: string;
  chantier: string | null;
  articles: {
    name: string;
    brand: string | null;
    reference: string | null;
  } | null;
  from_location: { name: string } | null;
  to_location: { name: string } | null;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getMovementLabel(type: string) {
  switch (type) {
    case "transfer":
      return "Transfert";
    case "entry":
      return "Entrée";
    case "exit":
      return "Sortie";
    case "adjustment":
      return "Ajustement";
    default:
      return type;
  }
}

export default function HistoriquePage() {
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMovements() {
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        id,
        movement_type,
        quantity,
        created_at,
        chantier,
        articles(name, brand, reference),
        from_location:locations!stock_movements_from_location_id_fkey(name),
        to_location:locations!stock_movements_to_location_id_fkey(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur historique :", error);
      setMovements([]);
    } else {
      setMovements((data as MovementRow[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMovements();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Historique</h1>
          <p className="mt-2 text-sm text-slate-200">
            Tous les mouvements de stock enregistrés
          </p>
        </div>

        <NavBar />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mouvements</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {movements.length} mouvement{movements.length > 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <p className="text-slate-500">Chargement...</p>
          ) : movements.length === 0 ? (
            <p className="text-slate-500">Aucun mouvement enregistré.</p>
          ) : (
            <div className="grid gap-4">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {getMovementLabel(movement.movement_type)}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(movement.created_at)}
                        </span>
                      </div>

                      <p className="text-lg font-semibold">
                        {movement.articles?.name || "Article inconnu"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {movement.articles?.brand || "-"}
                        {movement.articles?.reference
                          ? ` - ${movement.articles.reference}`
                          : ""}
                      </p>

                      {movement.chantier && (
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-medium">Chantier :</span>{" "}
                          {movement.chantier}
                        </p>
                      )}

                      <div className="mt-3 grid gap-2 text-sm text-slate-700">
                        <p>
                          <span className="font-medium">Depuis :</span>{" "}
                          {movement.from_location?.name || "-"}
                        </p>
                        <p>
                          <span className="font-medium">Vers :</span>{" "}
                          {movement.to_location?.name || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      Quantité : {movement.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}