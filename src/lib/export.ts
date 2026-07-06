import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Category, Transaction } from "./types";
import { formatCurrency, formatDateLong, todayISO } from "./format";

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${d} ${months[m - 1]} ${y}`;
};

export interface ExportPayload {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  periodLabel: string; // e.g. "1 Jul 2026 – 31 Jul 2026" or "Semua data"
}

function periodRangeLabel(txs: Transaction[]): string {
  if (txs.length === 0) return "Semua data";
  const sorted = [...txs].map((t) => t.date).sort();
  return `${formatDateLong(sorted[0])} – ${formatDateLong(sorted[sorted.length - 1])}`;
}

export function buildPeriodLabel(
  txs: Transaction[],
  period: "week" | "month" | "3m" | "all",
): string {
  if (period === "all") return periodRangeLabel(txs);
  return periodRangeLabel(txs);
}

export function exportPDF(payload: ExportPayload) {
  const { transactions, categories, currency, periodLabel } = payload;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "-";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Laporan Keuangan — Money Tracker", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Periode: ${periodLabel}`, 40, 68);
  doc.text(`Diekspor: ${formatDateLong(todayISO())}`, 40, 82);

  const income = transactions.filter((t) => t.type === "income");
  const expense = transactions.filter((t) => t.type === "expense");
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expense.reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Summary box
  doc.setDrawColor(220);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(40, 98, pageWidth - 80, 62, 8, 8, "F");
  doc.setTextColor(30);
  doc.setFontSize(9);
  doc.text("Total Saldo", 56, 118);
  doc.text("Total Pemasukan", 220, 118);
  doc.text("Total Pengeluaran", 400, 118);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(formatCurrency(balance, currency), 56, 140);
  doc.setTextColor(16, 122, 87);
  doc.text(formatCurrency(totalIncome, currency), 220, 140);
  doc.setTextColor(190, 40, 60);
  doc.text(formatCurrency(totalExpense, currency), 400, 140);

  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");

  const sortByDate = (a: Transaction, b: Transaction) => (a.date < b.date ? -1 : 1);

  let cursorY = 180;

  const drawSection = (
    title: string,
    rows: Transaction[],
    total: number,
    color: [number, number, number],
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, 40, cursorY);
    cursorY += 6;

    const body = rows
      .sort(sortByDate)
      .map((t, i) => [
        String(i + 1),
        shortDate(t.date),
        catName(t.categoryId),
        t.note ?? "",
        formatCurrency(t.amount, currency),
      ]);
    body.push([
      { content: "Subtotal", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } } as never,
      { content: formatCurrency(total, currency), styles: { fontStyle: "bold" } } as never,
    ]);

    autoTable(doc, {
      startY: cursorY + 4,
      head: [["No", "Tanggal", "Kategori", "Catatan", "Jumlah"]],
      body,
      styles: { font: "helvetica", fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: color, textColor: 255 },
      columnStyles: {
        0: { cellWidth: 30, halign: "right" },
        1: { cellWidth: 70 },
        2: { cellWidth: 100 },
        4: { halign: "right", cellWidth: 100 },
      },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        // footer page numbers added later
      },
    });
    // @ts-expect-error lastAutoTable is added by autotable
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 24;
  };

  drawSection("PEMASUKAN", income, totalIncome, [16, 122, 87]);
  if (cursorY > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage();
    cursorY = 60;
  }
  drawSection("PENGELUARAN", expense, totalExpense, [190, 40, 60]);

  // page numbers
  const pageCount = doc.getNumberOfPages();
  if (pageCount > 1) {
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text(
        `Halaman ${i} / ${pageCount}`,
        pageWidth - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" },
      );
    }
  }

  doc.save(`money-tracker-laporan-${todayISO()}.pdf`);
}

export function exportXLSX(payload: ExportPayload) {
  const { transactions, categories, currency, periodLabel } = payload;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "-";

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const numFmt = currency === "IDR" ? '"Rp" #,##0' : "#,##0";

  // Summary sheet
  const summaryRows = [
    ["Laporan Keuangan — Money Tracker"],
    ["Periode", periodLabel],
    ["Tanggal Export", formatDateLong(todayISO())],
    [],
    ["Metrik", "Nilai"],
    ["Total Saldo", balance],
    ["Total Pemasukan", totalIncome],
    ["Total Pengeluaran", totalExpense],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  ["B6", "B7", "B8"].forEach((ref) => {
    if (wsSummary[ref]) {
      wsSummary[ref].t = "n";
      wsSummary[ref].z = numFmt;
    }
  });
  wsSummary["!cols"] = [{ wch: 24 }, { wch: 28 }];

  // Transactions sheet
  const sorted = [...transactions].sort((a, b) => (a.date > b.date ? -1 : 1));
  const txHeader = ["No", "Tanggal", "Tipe", "Kategori", "Catatan", "Jumlah"];
  const txRows = sorted.map((t, i) => [
    i + 1,
    shortDate(t.date),
    t.type === "income" ? "Pemasukan" : "Pengeluaran",
    catName(t.categoryId),
    t.note ?? "",
    t.amount,
  ]);
  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  for (let i = 0; i < txRows.length; i++) {
    const ref = XLSX.utils.encode_cell({ r: i + 1, c: 5 });
    if (wsTx[ref]) {
      wsTx[ref].t = "n";
      wsTx[ref].z = numFmt;
    }
  }
  wsTx["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 32 }, { wch: 18 }];

  // Breakdown
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  const breakdown = Array.from(map.entries())
    .map(([cid, total]) => ({ name: catName(cid), total }))
    .sort((a, b) => b.total - a.total);
  const bHeader = ["Kategori", "Total", "Persentase"];
  const bRows = breakdown.map((b) => [
    b.name,
    b.total,
    totalExpense > 0 ? b.total / totalExpense : 0,
  ]);
  const wsB = XLSX.utils.aoa_to_sheet([bHeader, ...bRows]);
  for (let i = 0; i < bRows.length; i++) {
    const totalRef = XLSX.utils.encode_cell({ r: i + 1, c: 1 });
    const pctRef = XLSX.utils.encode_cell({ r: i + 1, c: 2 });
    if (wsB[totalRef]) {
      wsB[totalRef].t = "n";
      wsB[totalRef].z = numFmt;
    }
    if (wsB[pctRef]) {
      wsB[pctRef].t = "n";
      wsB[pctRef].z = "0.0%";
    }
  }
  wsB["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsTx, "Transaksi");
  XLSX.utils.book_append_sheet(wb, wsB, "Breakdown per Kategori");
  XLSX.writeFile(wb, `money-tracker-laporan-${todayISO()}.xlsx`);
}
