"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

interface Project {
  id: number;
  name: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewExpensePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [mode, setMode] = useState<"photo" | "manual">("photo");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<string>("");
  const [date, setDate] = useState(todayStr());
  const [storeName, setStoreName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [memo, setMemo] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) setProjectId(String(data[0].id));
      });
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/expenses/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "読み取りに失敗しました");
        return;
      }

      setReceiptPath(data.receiptPath);
      if (data.storeName) setStoreName(data.storeName);
      if (data.date) setDate(data.date);
      if (data.amount) setAmount(String(data.amount));
      if (data.category && CATEGORIES.includes(data.category)) {
        setCategory(data.category);
      }
    } catch {
      setError("読み取り中にエラーが発生しました。金額・日付などは手動で入力してください。");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !date || !amount || !category) {
      setError("案件・日付・金額・費目は必須です");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          date,
          storeName,
          amount,
          category,
          receiptPath,
          memo,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      router.push("/expenses");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">経費登録</h1>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("photo")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
            mode === "photo" ? "border-black bg-black text-white" : "border-black/15"
          }`}
        >
          レシート撮影・アップロード
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
            mode === "manual" ? "border-black bg-black text-white" : "border-black/15"
          }`}
        >
          手入力（レシートなし）
        </button>
      </div>

      {mode === "photo" && (
        <div className="mb-4 rounded-xl border border-black/10 bg-white p-4">
          <label className="block text-sm font-medium">レシート写真</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="レシートプレビュー"
              className="mt-3 max-h-64 rounded-lg border border-black/10"
            />
          )}
          {analyzing && (
            <p className="mt-2 text-sm text-black/60">AIが読み取り中...</p>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <div>
          <label className="block text-sm font-medium">案件</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            {projects.length === 0 && <option value="">案件を先に作成してください</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">金額</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1200"
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">店名（任意）</label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">費目</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">備考（任意）</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving || projects.length === 0}
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "登録する"}
        </button>
      </form>
    </div>
  );
}
