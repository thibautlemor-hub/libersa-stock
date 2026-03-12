"use client";

import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { supabase } from "../../lib/supabase";

type Article = {
  id: string;
  name: string;
  brand: string | null;
  reference: string | null;
};

type Location = {
  id: string;
  name: string;
};

export default function TransfertsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [articleId, setArticleId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");

  async function loadArticles() {
    const { data } = await supabase
      .from("articles")
      .select("id, name, brand, reference")
      .order("name");

    setArticles(data || []);
  }

  async function loadLocations() {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .order("name");

    setLocations(data || []);
  }

  async function getStockLevel(
    currentArticleId: string,
    currentLocationId: string
  ) {
    const { data, error } = await supabase
      .from("stock_levels")
      .select("id, quantity")
      .eq("article_id", currentArticleId)
      .eq("location_id", currentLocationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function upsertStockLevel(
    currentArticleId: string,
    currentLocationId: string,
    newQuantity: number
  ) {
    const existing = await getStockLevel(currentArticleId, currentLocationId);

    if (existing) {
      const { error } = await supabase
        .from("stock_levels")
        .update({ quantity: newQuantity })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("stock_levels").insert({
        article_id: currentArticleId,
        location_id: currentLocationId,
        quantity: newQuantity,
      });

      if (error) throw error;
    }
  }

  async function transferStock() {
    setMessage("");

    if (!articleId || !fromLocationId || !toLocationId || !quantity) {
      setMessage("Merci de remplir tous les champs.");
      return;
    }

    if (fromLocationId === toLocationId) {
      setMessage("Le départ et l’arrivée doivent être différents.");
      return;
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
      setMessage("La quantité doit être supérieure à 0.");
      return;
    }

    try {
      const fromStock = await getStockLevel(articleId, fromLocationId);
      const currentFromQty = Number(fromStock?.quantity || 0);

      if (currentFromQty < qty) {
        setMessage("Stock insuffisant sur l’emplacement de départ.");
        return;
      }

      const toStock = await getStockLevel(articleId, toLocationId);
      const currentToQty = Number(toStock?.quantity || 0);

      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          movement_type: "transfer",
          article_id: articleId,
          quantity: qty,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
        });

      if (movementError) throw movementError;

      await upsertStockLevel(articleId, fromLocationId, currentFromQty - qty);
      await upsertStockLevel(articleId, toLocationId, currentToQty + qty);

      setArticleId("");
      setFromLocationId("");
      setToLocationId("");
      setQuantity("");
      setMessage("Transfert enregistré avec succès.");
    } catch (error) {
      console.error(error);
      setMessage("Erreur pendant le transfert.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Transferts</h1>
          <p className="mt-2 text-sm text-slate-200">
            Déplacement du stock entre dépôt et camions
          </p>
        </div>

        <NavBar />

        {message && (
          <div className="mb-6 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Nouveau transfert</h2>

          <div className="grid max-w-xl gap-3">
            <select
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Choisir un article</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.name}
                  {article.brand ? ` - ${article.brand}` : ""}
                  {article.reference ? ` - ${article.reference}` : ""}
                </option>
              ))}
            </select>

            <select
              value={fromLocationId}
              onChange={(e) => setFromLocationId(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Emplacement de départ</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>

            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Emplacement d’arrivée</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Quantité"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />

            <button
              onClick={transferStock}
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-medium text-white"
            >
              Enregistrer le transfert
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}