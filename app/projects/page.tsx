"use client";

import { useEffect, useState } from "react";

interface Project {
  id: number;
  name: string;
  createdAt: string;
  _count: { expenses: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "作成に失敗しました");
        return;
      }
      setName("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">案件管理</h1>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="案件名（例: A社様 打ち合わせ出張）"
          className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          追加
        </button>
      </form>

      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {projects.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-black/50">
            案件がまだありません
          </li>
        )}
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{p.name}</span>
            <span className="text-sm text-black/50">{p._count.expenses} 件の経費</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
