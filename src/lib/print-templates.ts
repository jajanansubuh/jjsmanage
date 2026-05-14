import { format } from "date-fns";

export const getTransactionPrintTemplate = (selectedNote: string, reportDate: string | Date, noteDetails: any[]) => {
  const first = noteDetails[0];
  const rowsHtml = [...noteDetails]
    .sort((a, b) => (a.supplier?.name || "").localeCompare(b.supplier?.name || ""))
    .map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${row.supplier?.name || "-"}</td>
      <td align="right">${new Intl.NumberFormat('id-ID').format(row.revenue)}</td>
      <td align="right">${new Intl.NumberFormat('id-ID').format(row.cost)}</td>
      <td align="right">${new Intl.NumberFormat('id-ID').format(row.barcode)}</td>
      <td align="right">${new Intl.NumberFormat('id-ID').format(row.profit80)}</td>
      <td align="right">${new Intl.NumberFormat('id-ID').format(row.profit20)}</td>
    </tr>
  `).join('');

  const totals = {
    rev: noteDetails.reduce((s, r) => s + r.revenue, 0),
    cost: noteDetails.reduce((s, r) => s + r.cost, 0),
    bc: noteDetails.reduce((s, r) => s + r.barcode, 0),
    p80: noteDetails.reduce((s, r) => s + r.profit80, 0),
    p20: noteDetails.reduce((s, r) => s + r.profit20, 0),
  };

  return `
    <html>
      <head>
        <title>Cetak Ulang - ${selectedNote}</title>
        <style>
          @page { size: portrait; margin: 0; }
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
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedNote}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(reportDate), "dd MMMM yyyy")}</div>
        </div>
        ${first.notes ? `<div style="margin: 15px 0; padding: 10px; border: 1px dashed #ccc; font-style: italic; font-size: 12px;"><strong>Catatan:</strong> "${first.notes}"</div>` : ''}
        <table>
          <thead>
            <tr><th>No</th><th width="150">Suplier</th><th align="right">Pendapatan</th><th align="right">Cost</th><th align="right">Barcode</th><th align="right">Mitra Jjs</th><th align="right">Toko</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="2" align="center">TOTAL</td>
              <td align="right">${new Intl.NumberFormat('id-ID').format(totals.rev)}</td>
              <td align="right">${new Intl.NumberFormat('id-ID').format(totals.cost)}</td>
              <td align="right">${new Intl.NumberFormat('id-ID').format(totals.bc)}</td>
              <td align="right">${new Intl.NumberFormat('id-ID').format(totals.p80)}</td>
              <td align="right">${new Intl.NumberFormat('id-ID').format(totals.p20)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer-sig">
          <div class="sig">Kasir / Admin</div>
          <div class="sig">Manager Toko</div>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #999; font-style: italic;">
          Dicetak ulang pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </div>
      </body>
    </html>
  `;
};

export const getDeductionPrintTemplate = (selectedNote: string, reportDate: string | Date, noteDetails: any[]) => {
  const dates = noteDetails.map((r: any) => new Date(r.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  const rowsHtml = [...noteDetails]
    .sort((a, b) => (a.supplier?.name || "").localeCompare(b.supplier?.name || ""))
    .filter((r) => (r.serviceCharge || 0) > 0 || (r.kukuluban || 0) > 0 || (r.tabungan || 0) > 0)
    .map((r, index) => {
      const total = (r.serviceCharge || 0) + (r.kukuluban || 0) + (r.tabungan || 0);
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${r.supplier?.name || "Unknown"}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.serviceCharge || 0)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.kukuluban || 0)}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(r.tabungan || 0)}</td>
        <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(total)}</strong></td>
      </tr>
    `;
    })
    .join("");

  const totals = {
    sc: noteDetails.reduce((sum, r) => sum + (r.serviceCharge || 0), 0),
    kuk: noteDetails.reduce((sum, r) => sum + (r.kukuluban || 0), 0),
    tab: noteDetails.reduce((sum, r) => sum + (r.tabungan || 0), 0),
    grand: noteDetails.reduce((sum, r) => sum + (r.serviceCharge || 0) + (r.kukuluban || 0) + (r.tabungan || 0), 0)
  };

  return `
    <html>
      <head>
        <title>Cetak Ulang - ${selectedNote}</title>
        <style>
          @page { size: portrait; margin: 0; }
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
        <div class="header"><h1>Nota Potongan Mitra Jjs - Jajanan Subuh</h1></div>
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedNote}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(reportDate), "dd MMMM yyyy")}</div>
          <div class="meta-item"><span class="meta-label">Periode:</span> ${format(minDate, "dd/MM")} - ${format(maxDate, "dd/MM/yy")}</div>
        </div>
        <table>
          <thead>
            <tr><th>No</th><th width="150">Suplier</th><th align="right">S.Charge</th><th align="right">Kukuluban</th><th align="right">Tabungan</th><th align="right">Total Pot.</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="2" align="center">TOTAL KESELURUHAN</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.sc)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.kuk)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.tab)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.grand)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer-sig">
          <div class="sig">Kasir / Admin</div>
          <div class="sig">Manager Toko</div>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #999; font-style: italic;">
          Dicetak ulang pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </div>
      </body>
    </html>
  `;
};

export const getSavingsPrintTemplate = (selectedTabunganNote: any) => {
  const rowsHtml = [...selectedTabunganNote.suppliers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${s.name}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(s.revenue)}</td>
        <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(s.tabungan)}</strong></td>
      </tr>
    `)
    .join("");

  const totalTabungan = selectedTabunganNote.suppliers.reduce((sum: number, s: any) => sum + s.tabungan, 0);

  return `
    <html>
      <head>
        <title>Nota Tabungan - ${selectedTabunganNote.noteNumber}</title>
        <style>
          @page { size: portrait; margin: 0; }
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
        <div class="header"><h1>Laporan Tabungan Mitra Jjs - Jajanan Subuh</h1></div>
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedTabunganNote.noteNumber}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(selectedTabunganNote.date), "dd MMMM yyyy")}</div>
        </div>
        <table>
          <thead>
            <tr><th>No</th><th width="250">Nama Suplier</th><th align="right">Omzet</th><th align="right">Potongan Tabungan</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="3" align="center">TOTAL TABUNGAN</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totalTabungan)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer-sig">
          <div class="sig">Kasir / Admin</div>
          <div class="sig">Manager Toko</div>
        </div>
        <div style="text-align: center; margin-top: 30px; font-size: 9px; color: #999; font-style: italic;">
          Dicetak ulang pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </div>
      </body>
    </html>
  `;
};
