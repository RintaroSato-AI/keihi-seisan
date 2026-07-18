import ExcelJS from "exceljs";

interface ExpenseRow {
  date: string;
  storeName: string | null;
  category: string;
  amount: number;
  memo: string | null;
}

export async function generateReportExcelBuffer(params: {
  title: string;
  projectName: string;
  expenses: ExpenseRow[];
}): Promise<Buffer> {
  const { title, projectName, expenses } = params;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("経費精算書");

  sheet.mergeCells("A1", "E1");
  sheet.getCell("A1").value = title;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  sheet.getCell("A2").value = `案件: ${projectName}`;
  sheet.getCell("A2").font = { color: { argb: "FF666666" } };

  const headerRowIndex = 4;
  const headers = ["日付", "店名", "費目", "備考", "金額"];
  sheet.getRow(headerRowIndex).values = headers;
  sheet.getRow(headerRowIndex).font = { bold: true };
  sheet.getRow(headerRowIndex).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
  });

  expenses.forEach((e, i) => {
    const row = sheet.getRow(headerRowIndex + 1 + i);
    row.values = [e.date, e.storeName ?? "", e.category, e.memo ?? "", e.amount];
  });

  const totalRowIndex = headerRowIndex + 1 + expenses.length + 1;
  sheet.getCell(`D${totalRowIndex}`).value = "合計";
  sheet.getCell(`D${totalRowIndex}`).font = { bold: true };
  sheet.getCell(`E${totalRowIndex}`).value = expenses.reduce((sum, e) => sum + e.amount, 0);
  sheet.getCell(`E${totalRowIndex}`).font = { bold: true };

  sheet.columns = [
    { key: "date", width: 14 },
    { key: "storeName", width: 24 },
    { key: "category", width: 14 },
    { key: "memo", width: 28 },
    { key: "amount", width: 14 },
  ];

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
