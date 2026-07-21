import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { toViewUrl } from "@/lib/file-url";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await prisma.expenseReport.findUnique({
    where: { id: Number(id) },
    include: { project: true, expenses: { orderBy: { date: "asc" } } },
  });

  if (!report) notFound();

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">{report.title}</h1>
      <p className="mb-4 text-sm text-black/50">
        案件: {report.project.name} ／ 作成日: {report.generatedAt.toISOString().slice(0, 10)} ／{" "}
        {report.expenses.length}件 ／ 合計 ¥{report.totalAmount.toLocaleString()}
      </p>

      <div className="mb-6 flex gap-3">
        {report.pdfPath && (
          <a
            href={toViewUrl(report.pdfPath) ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            PDFを開く
          </a>
        )}
        <a
          href={`/api/reports/${report.id}/excel`}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium"
        >
          Excelをダウンロード
        </a>
      </div>

      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {report.expenses.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="text-sm text-black/50">
                {e.date} ・ {e.category}
              </div>
              <div className="font-medium">{e.storeName ?? "（店名なし）"}</div>
            </div>
            <span className="font-semibold">¥{e.amount.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
