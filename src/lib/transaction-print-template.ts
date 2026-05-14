import { format } from "date-fns";

export const getTransactionPrintTemplate = (
  noteNumber: string,
  date: string,
  cashierName: string,
  rows: any[],
  totals: any,
  suppliers: any[]
) => {
  const rowsHtml = rows
    .map((row, index) => {
      const sName = suppliers.find(s => s.id === row.supplierId)?.name || row.importedSupplierName || "Unknown";
      return `
      <tr>
        <td align="center">${index + 1}</td>
        <td>${sName}</td>
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
    <html>
      <head>
        <title>Nota Transaksi - ${noteNumber}</title>
        <style>
          @page { size: 215.9mm 330.2mm portrait; margin: 0; } /* F4 size */
          body { font-family: sans-serif; color: #333; line-height: 1.4; padding: 15mm; font-size: 12px; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          h1 { margin: 0; font-size: 20px; text-transform: uppercase; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 12px; }
          .meta-item { margin-bottom: 3px; }
          .meta-label { font-weight: bold; color: #666; display: inline-block; width: 80px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { background: #f0f0f0; padding: 8px 5px; text-align: left; border: 1px solid #ddd; text-transform: uppercase; }
          td { padding: 6px 5px; border: 1px solid #ddd; }
          .total-row td { background: #f9f9f9; font-weight: bold; border-top: 2px solid #333; }
          .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig { border-top: 1px solid #333; width: 160px; text-align: center; padding-top: 8px; margin-top: 60px; font-size: 11px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Transaksi Mitra Jjs - Jajanan Subuh</h1></div>
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${noteNumber}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${date}</div>
          <div class="meta-item"><span class="meta-label">Kasir:</span> ${cashierName}</div>
        </div>
        <table>
          <thead>
            <tr><th width="30">No</th><th width="150">Suplier</th><th align="right">Pendapatan</th><th align="right">Cost</th><th align="right">Barcode</th><th align="right">Mitra Jjs</th><th align="right">Toko</th></tr>
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
