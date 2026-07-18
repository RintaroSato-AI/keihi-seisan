import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReportExcelBuffer } from "@/lib/generate-report-excel";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await prisma.expenseReport.findUnique({
    where: { id: Number(id) },
    include: { project: true, expenses: true },
  });

  if (!report) {
    return NextResponse.json({ error: "精算書が見つかりません" }, { status: 404 });
  }

  const buffer = await generateReportExcelBuffer({
    title: report.title,
    projectName: report.project.name,
    expenses: report.expenses
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: e.date,
        storeName: e.storeName,
        category: e.category,
        amount: e.amount,
        memo: e.memo,
      })),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(report.title)}.xlsx"`,
    },
  });
}
