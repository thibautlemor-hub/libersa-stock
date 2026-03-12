"use client";

import { useEffect, useState } from "react";
import NavBar from "../../components/NavBar";
import { supabase } from "../../lib/supabase";

type Article = {
  id: string;
  name: string;
  brand: string | null;
  reference: string | null;
  description: string | null;
  unit: string | null;
  min_threshold: number | null;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      setArticles([]);
      return;
    }

    setArticles(data || []);
  }

  function resetForm() {
    setEditingArticleId(null);
    setName("");
    setBrand("");
    setReference("");
    setDescription("");
  }

  function startEdit(article: Article) {
    setMessage("");
    setEditingArticleId(article.id);
    setName(article.name || "");
    setBrand(article.brand || "");
    setReference(article.reference || "");
    setDescription(article.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveArticle() {
    setMessage("");

    if (!name.trim()) {
      setMessage("Merci de saisir un nom d’article.");
      return;
    }

    setSaving(true);

    try {
      if (editingArticleId) {
        const { error } = await supabase
          .from("articles")
          .update({
            name: name.trim(),
            brand: brand.trim() || null,
            reference: reference.trim() || null,
            description: description.trim() || null,
          })
          .eq("id", editingArticleId);

        if (error) throw error;

        setMessage("Article modifié avec succès.");
      } else {
        const { error } = await supabase.from("articles").insert({
          name: name.trim(),
          brand: brand.trim() || null,
          reference: reference.trim() || null,
          description: description.trim() || null,
          unit: "piece",
          min_threshold: 0,
        });

        if (error) throw error;

        setMessage("Article ajouté avec succès.");
      }

      resetForm();
      await loadArticles();
    } catch (error: any) {
      console.error("Erreur sauvegarde article :", error);
      setMessage(error?.message || "Erreur pendant l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteArticle(articleId: string, articleName: string) {
    setMessage("");

    const confirmed = window.confirm(
      `Supprimer l'article "${articleName}" ?`
    );

    if (!confirmed) return;

    setLoadingDeleteId(articleId);

    try {
      const { error: stockLevelsError } = await supabase
        .from("stock_levels")
        .delete()
        .eq("article_id", articleId);

      if (stockLevelsError) throw stockLevelsError;

      const { error: movementsError } = await supabase
        .from("stock_movements")
        .delete()
        .eq("article_id", articleId);

      if (movementsError) throw movementsError;

      const { error: articleError } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (articleError) throw articleError;

      if (editingArticleId === articleId) {
        resetForm();
      }

      setMessage(`Article "${articleName}" supprimé avec succès.`);
      await loadArticles();
    } catch (error: any) {
      console.error("Erreur suppression article :", error);
      setMessage(
        error?.message || "Erreur pendant la suppression de l’article."
      );
    } finally {
      setLoadingDeleteId(null);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="mt-2 text-sm text-slate-200">
            Gestion des références de stock
          </p>
        </div>

        <NavBar />

        {message && (
          <div className="mb-6 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            {message}
          </div>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {editingArticleId ? "Modifier un article" : "Ajouter un article"}
            </h2>

            {editingArticleId && (
              <button
                onClick={resetForm}
                className="rounded-2xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Nom de l'article"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />

            <input
              type="text"
              placeholder="Marque"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />

            <input
              type="text"
              placeholder="Référence"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[110px] rounded-2xl border border-slate-300 px-4 py-3"
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveArticle}
                disabled={saving}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-60"
              >
                {saving
                  ? "Enregistrement..."
                  : editingArticleId
                  ? "Enregistrer les modifications"
                  : "Ajouter"}
              </button>

              {editingArticleId && (
                <button
                  onClick={resetForm}
                  className="rounded-2xl bg-slate-200 px-5 py-3 font-medium text-slate-800"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Liste des articles</h2>

          <div className="grid gap-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{article.name}</p>

                    <div className="mt-3 grid gap-1 text-sm text-slate-700">
                      <p>
                        <span className="font-medium">Marque :</span>{" "}
                        {article.brand || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Référence :</span>{" "}
                        {article.reference || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Description :</span>{" "}
                        {article.description || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => startEdit(article)}
                      className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      Modifier
                    </button>

                    <button
                      onClick={() => deleteArticle(article.id, article.name)}
                      disabled={loadingDeleteId === article.id}
                      className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {loadingDeleteId === article.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}