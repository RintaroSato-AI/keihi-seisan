"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";

interface Project {
  id: number;
  name: string;
}

interface ReceiptItem {
  id: string;
  file: File;
  previewUrl: string;
  analyzing: boolean;
  error: string | null;
  receiptPath: string | null;
  date: string;
  storeName: string;
  amount: string;
  category: string;
  memo: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function analyzeFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/expenses/analyze", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "読み取りに失敗しました");
  return data as {
    receiptPath: string;
    storeName: string | null;
    date: string | null;
    amount: number | null;
    category: string | null;
  };
}

export default function NewExpensePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mode, setMode] = useState<"photo" | "manual">("photo");
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>("");

  const [items, setItems] = useState<ReceiptItem[]>([]);

  const [date, setDate] = useState(todayStr());
  const [storeName, setStoreName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) setProjectId(String(data[0].id));
      });
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    const newItems: ReceiptItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      analyzing: true,
      error: null,
      receiptPath: null,
      date: todayStr(),
      storeName: "",
      amount: "",
      category: CATEGORIES[0],
      memo: "",
    }));

    setItems((prev) => [...prev, ...newItems]);

    newItems.forEach((item) => {
      analyzeFile(item.file)
        .then((data) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    analyzing: false,
                    receiptPath: data.receiptPath,
                    storeName: data.storeName ?? "",
                    date: data.date ?? it.date,
                    amount: data.amount ? String(data.amount) : "",
                    category:
                      data.category && CATEGORIES.includes(data.category as never)
                        ? data.category
                        : it.category,
                  }
                : it
            )
          );
        })
        .catch((err: Error) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, analyzing: false, error: err.message } : it
            )
          );
        });
    });
  }

  function updateItem(id: string, patch: Partial<ReceiptItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  async function handlePhotoSubmit() {
    const validItems = items.filter((it) => it.amount && it.category && !it.analyzing);
    if (!projectId || validItems.length === 0) {
      setError("案件の選択と、金額が入った経費が1件以上必要です");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      for (const it of validItems) {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            date: it.date,
            storeName: it.storeName,
            amount: it.amount,
            category: it.category,
            receiptPath: it.receiptPath,
            memo: it.memo,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "保存に失敗しました");
        }
      }
      router.push("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
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
        body: JSON.stringify({ projectId, date, storeName, amount, category, memo }),
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

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {mode === "photo" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">案件</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            >
              {projects.length === 0 && <option value="">案件を先に作成してください</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
              dragActive ? "border-black bg-black/5" : "border-black/20 bg-white"
            }`}
          >
            <p className="text-sm font-medium">
              レシート画像をドラッグ&ドロップ、またはクリックして選択
            </p>
            <p className="mt-1 text-xs text-black/50">複数枚まとめて選択できます</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>

          {items.length > 0 && (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex gap-3 rounded-xl border border-black/10 bg-white p-3"
                >
                  <img
                    src={it.previewUrl}
                    alt="レシート"
                    className="h-20 w-20 shrink-0 rounded-lg border border-black/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    {it.analyzing ? (
                      <p className="text-sm text-black/60">AIが読み取り中...</p>
                    ) : (
                      <>
                        {it.error && (
                          <p className="mb-1 text-xs text-red-600">{it.error}（手動で入力してください）</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <input
                            type="date"
                            value={it.date}
                            onChange={(e) => updateItem(it.id, { date: e.target.value })}
                            className="rounded-lg border border-black/15 px-2 py-1.5 text-sm"
                          />
                          <input
                            type="number"
                            value={it.amount}
                            onChange={(e) => updateItem(it.id, { amount: e.target.value })}
                            placeholder="金額"
                            className="rounded-lg border border-black/15 px-2 py-1.5 text-sm"
                          />
                          <input
                            value={it.storeName}
                            onChange={(e) => updateItem(it.id, { storeName: e.target.value })}
                            placeholder="店名"
                            className="rounded-lg border border-black/15 px-2 py-1.5 text-sm"
                          />
                          <select
                            value={it.category}
                            onChange={(e) => updateItem(it.id, { category: e.target.value })}
                            className="rounded-lg border border-black/15 px-2 py-1.5 text-sm"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="shrink-0 self-start text-xs text-red-600 underline"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handlePhotoSubmit}
            disabled={saving || items.length === 0 || projects.length === 0}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "保存中..." : `${items.length > 0 ? items.length + "件を" : ""}登録する`}
          </button>
        </div>
      )}

      {mode === "manual" && (
        <form
          onSubmit={handleManualSubmit}
          className="space-y-4 rounded-xl border border-black/10 bg-white p-4"
        >
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
      )}
    </div>
  );
}
