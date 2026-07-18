import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { date, storeName, amount, category, memo, projectId } = body;

  const expense = await prisma.expense.update({
    where: { id: Number(id) },
    data: {
      ...(date !== undefined ? { date } : {}),
      ...(storeName !== undefined ? { storeName: storeName || null } : {}),
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(memo !== undefined ? { memo: memo || null } : {}),
      ...(projectId !== undefined ? { projectId: Number(projectId) } : {}),
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
