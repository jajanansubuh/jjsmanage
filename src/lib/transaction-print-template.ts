import { format } from "date-fns";

export const getTransactionPrintTemplate = (
  noteNumber: string,
  date: string,
  cashierName: string,
  rows: any[],
  totals: any,
  suppliers: any[] = []
) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/logojjsmanage.png`;

  const rowsHtml = rows
    .map((row, index) => {
      const sName = suppliers.find((s: any) => s.id === row.supplierId)?.name || row.importedSupplierName || "Unknown";
      return `
      <tr>
        <td align="center">${index + 1}</td>
        <td class="col-supplier">${sName}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(row.revenue)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(row.cost)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(row.barcode)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(row.profit80)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(row.profit20)}</td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Nota Transaksi - ${noteNumber}</title>
        ${origin ? `<base href="${origin}/">` : ''}
        <style>
          @page { size: portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111; line-height: 1.3; margin: 0; padding: 0; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #222; padding-bottom: 12px; }
          .logo-container { margin-bottom: 8px; text-align: center; }
          .logo { height: 55px; width: auto; max-width: 220px; object-fit: contain; display: inline-block; }
          h1 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px; }
          .meta-item { margin-bottom: 3px; }
          .meta-label { font-weight: bold; color: #555; display: inline-block; width: 80px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #f1f5f9; padding: 8px 6px; text-align: left; border: 1px solid #cbd5e1; text-transform: uppercase; white-space: nowrap; font-weight: bold; }
          td { padding: 6px; border: 1px solid #e2e8f0; vertical-align: middle; }
          .col-supplier { white-space: nowrap; font-weight: bold; min-width: 150px; }
          .total-row td { background: #f8fafc; font-weight: bold; border-top: 2px solid #334155; }
          .footer-sig { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 6px; margin-top: 50px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img src="${logoUrl}" alt="Logo JJS" class="logo" />
          </div>
          <h1>Transaksi Mitra Jjs - Jajanan Subuh</h1>
        </div>
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${noteNumber}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${date}</div>
          <div class="meta-item"><span class="meta-label">Kasir:</span> ${cashierName}</div>
        </div>
        <table>
          <thead>
            <tr><th width="30">No</th><th class="col-supplier">Suplier</th><th align="right">Pendapatan</th><th align="right">Cost</th><th align="right">Barcode</th><th align="right">Mitra Jjs</th><th align="right">Toko</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="2" align="center">TOTAL</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.revenue)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.cost)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.barcode)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.profit80)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.profit20)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer-sig">
          <div class="sig">Kasir / Admin</div>
          <div class="sig">Manager Toko</div>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #999; font-style: italic;">
          Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </div>
      </body>
    </html>
  `;
};
