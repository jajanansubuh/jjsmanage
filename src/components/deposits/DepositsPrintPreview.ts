import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DepositItem } from "@/app/(dashboard)/deposits/hooks/use-deposits-data";

export function handlePrintDeposits(
  filteredAndSortedData: DepositItem[], 
  dateRange: DateRange | undefined, 
  role: string | null,
  bankFilter: string
) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const formattedFrom = dateRange?.from ? format(dateRange.from, "dd MMM yyyy", { locale: localeId }) : "";
  const formattedTo = dateRange?.to ? format(dateRange.to, "dd MMM yyyy", { locale: localeId }) : "";
  const rangeText = formattedFrom === formattedTo ? formattedFrom : `${formattedFrom} - ${formattedTo}`;

  // Pastikan data yang dicetak selalu urut A-Z berdasarkan nama UMKM
  const dataToPrint = [...filteredAndSortedData].sort((a, b) =>
    a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
  );

  const totalPayout = dataToPrint.reduce((sum, item) => sum + item.dailyProfit, 0);

  const tableRows = dataToPrint.map((item, i) => `
    <tr>
      <td class="col-no">${i + 1}</td>
      <td class="col-umkm">${item.name}</td>
      <td class="col-pemilik">${item.ownerName || '-'}</td>
      <td class="col-bank">${item.bankName || '-'}</td>
      <td class="col-rek">${item.accountNumber || '-'}</td>
      <td class="col-total">
        <div style="display: flex; justify-content: space-between;">
          <span>Rp</span>
          <span>${new Intl.NumberFormat('id-ID').format(item.dailyProfit)}</span>
        </div>
      </td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Daftar Penyetoran - ${rangeText}</title>
        <style>
          @page { size: portrait; margin: 0; }
          body { 
            font-family: sans-serif; 
            color: #333; 
            line-height: 1.4; 
            padding: 20mm;
          }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
          .meta { margin-top: 10px; font-weight: bold; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background: #f5f5f5; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #ddd; white-space: nowrap; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .col-no { text-align: center; width: 40px; }
          .col-umkm { font-weight: bold; white-space: nowrap; }
          .col-pemilik { word-break: break-word; }
          .col-bank { font-weight: bold; white-space: nowrap; }
          .col-rek { font-family: monospace; white-space: nowrap; }
          .col-total { font-weight: bold; white-space: nowrap; width: 120px; }
          .total { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; }
          .total-container { display: flex; justify-content: flex-end; font-size: 16px; font-weight: bold; align-items: center; }
          .total-label { margin-right: 20px; text-transform: uppercase; }
          .total-value { width: 150px; display: flex; justify-content: space-between; font-size: 18px; }
          .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 10px; margin-top: 80px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${role === "SUPPLIER" ? "Laporan Saldo Mitra Jjs" : "Laporan Penyetoran Mitra Jjs"}</h1>
          <div class="meta">Periode: ${rangeText}</div>
          ${bankFilter !== "ALL" ? `<div class="meta" style="margin-top: 5px;">Filter: ${bankFilter}</div>` : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th>Nama UMKM</th>
              <th>Pemilik</th>
              <th>Bank</th>
              <th>No Rekening</th>
              <th style="text-align:right">Total Setor</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="total">
          <div class="total-container">
            <div class="total-label">Total Seluruhnya</div>
            <div class="total-value">
              <span>Rp</span>
              <span>${new Intl.NumberFormat('id-ID').format(totalPayout)}</span>
            </div>
          </div>
        </div>
        <div class="footer-sig">
          <div class="sig">Penyetor</div>
          <div class="sig">Admin</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}
