import ExcelJS from "exceljs";

interface ExpenseRow {
  date: string;
  projectName: string;
  storeName: string | null;
  category: string;
  amount: number;
  memo: string | null;
}

export async function generateExpensesExcelBuffer(params: {
  title: string;
  expenses: ExpenseRow[];
}): Promise<Buffer> {
  const { title, expenses } = params;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("経費一覧");

  sheet.mergeCells("A1", "F1");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  const headerRowIndex = 3;
  const headers = ["日付", "案件", "店名", "費目", "備考", "金額"];
  sheet.getRow(headerRowIndex).values = headers;
  sheet.getRow(headerRowIndex).font = { bold: true };
  sheet.getRow(headerRowIndex).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
  });

  expenses.forEach((e, i) => {
    const row = sheet.getRow(headerRowIndex + 1 + i);
    row.values = [e.date, e.projectName, e.storeName ?? "", e.category, e.memo ?? "", e.amount];
  });

  const totalRowIndex = headerRowIndex + 1 + expenses.length + 1;
  sheet.getCell(`E${totalRowIndex}`).value = "合計";
  sheet.getCell(`E${totalRowIndex}`).font = { bold: true };
  sheet.getCell(`F${totalRowIndex}`).value = expenses.reduce((sum, e) => sum + e.amount, 0);
  sheet.getCell(`F${totalRowIndex}`).font = { bold: true };

  sheet.columns = [
    { key: "date", width: 14 },
    { key: "projectName", width: 22 },
    { key: "storeName", width: 22 },
    { key: "category", width: 14 },
    { key: "memo", width: 26 },
    { key: "amount", width: 14 },
  ];

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
