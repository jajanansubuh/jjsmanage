import { format } from "date-fns";

export const getPotonganPrintTemplate = (savedNoteInfo: any) => {
  const rowsHtml = [...savedNoteInfo.details]
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
    .filter((r) => r.serviceCharge > 0 || r.kukuluban > 0 || r.tabungan > 0)
    .map((r, index) => {
      const total = r.serviceCharge + r.kukuluban + r.tabungan;
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${r.supplierName}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.serviceCharge)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.kukuluban)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.tabungan)}</td>
        <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(total)}</strong></td>
      </tr>
    `;
    })
    .join("");

  return `
    <html>
      <head>
        <title>Nota Potongan - ${savedNoteInfo.noteNumber}</title>
        <style>
          @page { size: portrait; margin: 0; }
          body { 
            font-family: sans-serif; 
            color: #333; 
            line-height: 1.4; 
            padding: 15mm; 
            font-size: 12px;
          }
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
        <div class="header">
          <h1>Nota Potongan Mitra Jjs - Jajanan Subuh</h1>
        </div>
        
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${savedNoteInfo.noteNumber}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(savedNoteInfo.date), "dd MMMM yyyy")}</div>
          <div class="meta-item"><span class="meta-label">Periode:</span> ${format(new Date(savedNoteInfo.startDate), "dd/MM")} - ${format(new Date(savedNoteInfo.endDate), "dd/MM/yy")}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th width="150">Suplier</th>
              <th align="right">S.Charge</th>
              <th align="right">Kukuluban</th>
              <th align="right">Tabungan</th>
              <th align="right">Total Pot.</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="2" align="center">TOTAL KESELURUHAN</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.serviceCharge)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.kukuluban)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.tabungan)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(savedNoteInfo.totals.grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer-sig">
          <div class="sig">Kasir / Admin</div>
          <div class="sig">Manager Toko</div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #999;">
          Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </div>
      </body>
    </html>
  `;
};
