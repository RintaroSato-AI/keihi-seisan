import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { generateReportPdfBuffer } from "@/lib/generate-report-pdf";

export async function GET() {
  const reports = await prisma.expenseReport.findMany({
    orderBy: { generatedAt: "desc" },
    include: { project: true, _count: { select: { expenses: true } } },
  });
  return NextResponse.json(reports);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, title, expenseIds } = body;

  if (!projectId || !title || !Array.isArray(expenseIds) || expenseIds.length === 0) {
    return NextResponse.json(
      { error: "案件・タイトル・対象経費の選択は必須です" },
      { status: 400 }
    );
  }

  const expenses = await prisma.expense.findMany({
    where: { id: { in: expenseIds.map(Number) }, projectId: Number(projectId) },
  });

  if (expenses.length === 0) {
    return NextResponse.json({ error: "対象の経費が見つかりません" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: Number(projectId) } });
  if (!project) {
    return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const report = await prisma.expenseReport.create({
    data: { projectId: Number(projectId), title, totalAmount },
  });

  await prisma.expense.updateMany({
    where: { id: { in: expenses.map((e) => e.id) } },
    data: { reportId: report.id },
  });

  const pdfBuffer = await generateReportPdfBuffer({
    title,
    projectName: project.name,
    generatedAt: report.generatedAt,
    expenses: expenses
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({
        date: e.date,
        storeName: e.storeName,
        category: e.category,
        amount: e.amount,
        memo: e.memo,
        receiptPath: e.receiptPath,
      })),
  });

  let pdfPath: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`reports/${report.id}.pdf`, pdfBuffer, {
      access: "public",
      contentType: "application/pdf",
    });
    pdfPath = blob.url;
  } else {
    const dir = path.join(process.cwd(), "public", "uploads", "reports");
    await mkdir(dir, { recursive: true });
    pdfPath = `/uploads/reports/${report.id}.pdf`;
    await writeFile(path.join(dir, `${report.id}.pdf`), pdfBuffer);
  }

  const updated = await prisma.expenseReport.update({
    where: { id: report.id },
    data: { pdfPath },
  });

  return NextResponse.json(updated, { status: 201 });
}
