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

export default function EntreesStockPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [articleId, setArticleId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select("id, name, brand, reference")
      .order("name");

    if (error) {
      console.error("Erreur chargement articles :", error);
      return;
    }

    setArticles(data || []);
  }

  async function loadLocations() {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Erreur chargement emplacements :", error);
      return;
    }

    setLocations(data || []);
  }

  async function getStockLevel(currentArticleId: string, currentLocationId: string) {
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
    addedQuantity: number
  ) {
    const existing = await getStockLevel(currentArticleId, currentLocationId);

    if (existing) {
      const currentQty = Number(existing.quantity || 0);

      const { error } = await supabase
        .from("stock_levels")
        .update({ quantity: currentQty + addedQuantity })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("stock_levels")
        .insert({
          article_id: currentArticleId,
          location_id: currentLocationId,
          quantity: addedQuantity,
        });

      if (error) throw error;
    }
  }

  async function enregistrerEntree() {
    setMessage("");

    if (!articleId || !locationId || !quantity) {
      setMessage("Merci de remplir tous les champs.");
      return;
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
      setMessage("La quantité doit être supérieure à 0.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setMessage("Utilisateur non connecté.");
        setLoading(false);
        return;
      }

      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          movement_type: "entry",
          article_id: articleId,
          quantity: qty,
          to_location_id: locationId,
          created_by: user.id,
        });

      if (movementError) {
        throw movementError;
      }

      await upsertStockLevel(articleId, locationId, qty);

      setArticleId("");
      setLocationId("");
      setQuantity("");
      setMessage("Entrée de stock enregistrée avec succès.");
    } catch (error: any) {
      console.error("Erreur complète entrée stock :", error);
      setMessage(error?.message || "Erreur pendant l’enregistrement de l’entrée.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
    loadLocations();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Entrées de stock</h1>
          <p className="mt-2 text-sm text-slate-200">
            Approvisionner le dépôt ou les camions
          </p>
        </div>

        <NavBar />

        {message && (
          <div className="mb-6 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Nouvelle entrée</h2>

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
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Choisir un emplacement</option>
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
              onClick={enregistrerEntree}
              disabled={loading}
              className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Enregistrer l’entrée de stock"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}