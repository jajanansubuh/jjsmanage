import { format } from "date-fns";

export const getPotonganPrintTemplate = (savedNoteInfo: any) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/logojjsmanage.png`;

  const rowsHtml = [...savedNoteInfo.details]
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
    .filter((r) => r.serviceCharge > 0 || r.kukuluban > 0 || r.tabungan > 0)
    .map((r, index) => {
      const total = r.serviceCharge + r.kukuluban + r.tabungan;
      return `
      <tr>
        <td>${index + 1}</td>
        <td class="col-supplier">${r.supplierName}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.serviceCharge)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.kukuluban)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.tabungan)}</td>
        <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(total)}</strong></td>
      </tr>
    `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Nota Potongan - ${savedNoteInfo.noteNumber}</title>
        ${origin ? `<base href="${origin}/">` : ''}
        <style>
          @page { size: portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #111; 
            line-height: 1.3; 
            margin: 0;
            padding: 0;
          }
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
              <th width="30">No</th>
              <th class="col-supplier">Suplier</th>
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
