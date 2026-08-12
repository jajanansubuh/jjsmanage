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
  const totalMinus = dataToPrint.reduce((sum, item) => item.dailyProfit < 0 ? sum + item.dailyProfit : sum, 0);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/logojjsmanage.png`;

  const tableRows = dataToPrint.map((item, i) => {
    const isMinus = item.dailyProfit < 0;
    const colorStyle = isMinus ? 'color: red;' : '';
    return `
    <tr>
      <td class="col-no">${i + 1}</td>
      <td class="col-umkm">${item.name}</td>
      <td class="col-pemilik">${item.ownerName || '-'}</td>
      <td class="col-bank">${item.bankName || '-'}</td>
      <td class="col-rek">${item.accountNumber || '-'}</td>
      <td class="col-total">
        <div style="display: flex; justify-content: space-between; ${colorStyle}">
          <span>Rp</span>
          <span>${new Intl.NumberFormat('id-ID').format(item.dailyProfit)}</span>
        </div>
      </td>
    </tr>
  `}).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Daftar Penyetoran - ${rangeText}</title>
        ${origin ? `<base href="${origin}/">` : ''}
        <style>
          @page { 
            size: portrait; 
            margin: 10mm 12mm; 
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #111; 
            line-height: 1.3; 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #222; 
            padding-bottom: 12px; 
          }
          .logo-container {
            margin-bottom: 8px;
            text-align: center;
          }
          .logo { 
            height: 60px; 
            width: auto; 
            max-width: 220px;
            object-fit: contain; 
            display: inline-block; 
          }
          h1 { 
            margin: 0; 
            font-size: 20px; 
            font-weight: 800;
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            color: #111;
          }
          .meta { 
            margin-top: 6px; 
            font-weight: 600; 
            color: #444; 
            font-size: 13px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            font-size: 12px; 
          }
          th { 
            background: #f1f5f9; 
            padding: 8px 6px; 
            text-align: left; 
            font-size: 11px; 
            font-weight: 700;
            text-transform: uppercase; 
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #475569; 
            white-space: nowrap; 
            color: #1e293b;
          }
          td { 
            padding: 7px 6px; 
            border-bottom: 1px solid #e2e8f0; 
            vertical-align: middle; 
          }
          .col-no { text-align: center; width: 35px; white-space: nowrap; }
          .col-umkm { font-weight: bold; white-space: nowrap; min-width: 80px; }
          .col-pemilik { white-space: nowrap; min-width: 170px; width: 32%; }
          .col-bank { font-weight: bold; white-space: nowrap; min-width: 80px; }
          .col-rek { font-family: monospace, Courier, monospace; white-space: nowrap; min-width: 140px; }
          .col-total { font-weight: bold; white-space: nowrap; min-width: 120px; text-align: right; }
          
          .total { 
            margin-top: 20px; 
            border-top: 2px solid #222; 
            padding-top: 12px; 
          }
          .total-container { 
            display: flex; 
            justify-content: flex-end; 
            font-size: 14px; 
            font-weight: bold; 
            align-items: center; 
          }
          .total-label { margin-right: 20px; text-transform: uppercase; }
          .total-value { width: 160px; display: flex; justify-content: space-between; font-size: 15px; }
          .footer-sig { 
            margin-top: 35px; 
            display: flex; 
            justify-content: space-between; 
            page-break-inside: avoid; 
          }
          .sig { 
            border-top: 1px solid #333; 
            width: 180px; 
            text-align: center; 
            padding-top: 6px; 
            margin-top: 50px; 
            font-weight: bold; 
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img src="${logoUrl}" alt="Logo JJS" class="logo" />
          </div>
          <h1>${role === "SUPPLIER" ? "Laporan Saldo Mitra Jjs" : "Laporan Penyetoran Mitra Jjs"}</h1>
          <div class="meta">Periode: ${rangeText}</div>
          ${bankFilter !== "ALL" ? `<div class="meta" style="margin-top: 4px;">Filter: ${bankFilter}</div>` : ""}
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-no">No</th>
              <th class="col-umkm">Nama UMKM</th>
              <th class="col-pemilik">Pemilik</th>
              <th class="col-bank">Bank</th>
              <th class="col-rek">No Rekening</th>
              <th class="col-total" style="text-align:right">Total Setor</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="total">
          <div class="total-container" style="margin-bottom: 8px;">
            <div class="total-label">Total Minus</div>
            <div class="total-value" style="color: red;">
              <span>Rp</span>
              <span>${new Intl.NumberFormat('id-ID').format(totalMinus)}</span>
            </div>
          </div>
          <div class="total-container">
            <div class="total-label">Total Seluruhnya</div>
            <div class="total-value" style="${totalPayout < 0 ? 'color: red;' : ''}">
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

  // Print after small delay to ensure styles and images render
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}
