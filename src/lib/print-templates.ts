import { format } from "date-fns";

const getHeaderHtml = (title: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const logoUrl = `${origin}/logojjsmanage.png`;
  return `
    <div class="header">
      <div class="logo-container">
        <img src="${logoUrl}" alt="Logo JJS" class="logo" />
      </div>
      <h1>${title}</h1>
    </div>
  `;
};

const getHeadTagHtml = (titleText: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `
    <meta charset="utf-8">
    <title>${titleText}</title>
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
  `;
};

export const getTransactionPrintTemplate = (selectedNote: string, reportDate: string | Date, noteDetails: any[]) => {
  const first = noteDetails[0];
  const rowsHtml = [...noteDetails]
    .sort((a, b) => (a.supplier?.name || "").localeCompare(b.supplier?.name || ""))
    .map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="col-supplier">${row.supplier?.name || "-"}</td>
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
    <!DOCTYPE html>
    <html>
      <head>
        ${getHeadTagHtml(`Cetak Ulang - ${selectedNote}`)}
      </head>
      <body>
        ${getHeaderHtml("Transaksi Mitra Jjs - Jajanan Subuh")}
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedNote}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(reportDate), "dd MMMM yyyy")}</div>
        </div>
        ${first.notes ? `<div style="margin: 15px 0; padding: 10px; border: 1px dashed #ccc; font-style: italic; font-size: 12px;"><strong>Catatan:</strong> "${first.notes}"</div>` : ''}
        <table>
          <thead>
            <tr><th width="30">No</th><th class="col-supplier">Suplier</th><th align="right">Pendapatan</th><th align="right">Cost</th><th align="right">Barcode</th><th align="right">Mitra Jjs</th><th align="right">Toko</th></tr>
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
        <td class="col-supplier">${r.supplier?.name || "Unknown"}</td>
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
    <!DOCTYPE html>
    <html>
      <head>
        ${getHeadTagHtml(`Cetak Ulang - ${selectedNote}`)}
      </head>
      <body>
        ${getHeaderHtml("Nota Potongan Mitra Jjs - Jajanan Subuh")}
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedNote}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(reportDate), "dd MMMM yyyy")}</div>
          <div class="meta-item"><span class="meta-label">Periode:</span> ${format(minDate, "dd/MM")} - ${format(maxDate, "dd/MM/yy")}</div>
        </div>
        <table>
          <thead>
            <tr><th width="30">No</th><th class="col-supplier">Suplier</th><th align="right">S.Charge</th><th align="right">Kukuluban</th><th align="right">Tabungan</th><th align="right">Total Pot.</th></tr>
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
  const activeSuppliers = (selectedTabunganNote?.suppliers || [])
    .filter((s: any) => (Number(s.tabungan) || 0) > 0)
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  const rowsHtml = activeSuppliers
    .map((s: any, index: number) => `
      <tr>
        <td>${index + 1}</td>
        <td class="col-supplier">${s.name}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(s.cost ?? s.revenue ?? 0)}</td>
        <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(s.tabungan)}</strong></td>
      </tr>
    `)
    .join("");

  const totalTabungan = activeSuppliers.reduce((sum: number, s: any) => sum + (Number(s.tabungan) || 0), 0);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${getHeadTagHtml(`Nota Tabungan - ${selectedTabunganNote.noteNumber}`)}
      </head>
      <body>
        ${getHeaderHtml("Laporan Tabungan Mitra Jjs - Jajanan Subuh")}
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">No Nota:</span> <strong>${selectedTabunganNote.noteNumber}</strong></div>
          <div class="meta-item"><span class="meta-label">Tanggal:</span> ${format(new Date(selectedTabunganNote.date), "dd MMMM yyyy")}</div>
        </div>
        <table>
          <thead>
            <tr><th width="30">No</th><th class="col-supplier">Nama Suplier</th><th align="right">Total Cost</th><th align="right">Potongan Tabungan</th></tr>
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

export const getSavingsSummaryPrintTemplate = (data: any[], startDate?: string, endDate?: string) => {
  const rowsHtml = [...data]
    .map((s, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${format(new Date(s.date), "dd/MM/yyyy")}</td>
        <td>${s.noteNumber}</td>
        <td class="col-supplier">${s.supplierNames.join(", ") || "-"}</td>
        <td align="right">${new Intl.NumberFormat("id-ID").format(s.totalRevenue)}</td>
        <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(s.totalTabungan)}</strong></td>
      </tr>
    `)
    .join("");

  const totals = {
    revenue: data.reduce((sum, s) => sum + s.totalRevenue, 0),
    savings: data.reduce((sum, s) => sum + s.totalTabungan, 0),
  };

  const periodText = startDate && endDate 
    ? `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`
    : "Semua Periode";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${getHeadTagHtml("Laporan Ringkasan Tabungan")}
      </head>
      <body>
        ${getHeaderHtml("Laporan Ringkasan Tabungan Mitra")}
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Periode:</span> ${periodText}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="30">No</th>
              <th>Tanggal</th>
              <th>No. Nota</th>
              <th class="col-supplier">Suplier</th>
              <th align="right">Total Omzet</th>
              <th align="right">Total Tabungan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="4" align="center">TOTAL KESELURUHAN</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.revenue)}</td>
              <td align="right">${new Intl.NumberFormat("id-ID").format(totals.savings)}</td>
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

export const getDeductionsSummaryPrintTemplate = (data: any[], startDate?: string, endDate?: string) => {
  const rowsHtml = [...data]
    .map((d, index) => {
      const total = (d.serviceCharge || 0) + (d.kukuluban || 0) + (d.tabungan || 0);
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${format(new Date(d.deductionDate || d.date || d.createdAt), "dd/MM/yyyy")}</td>
          <td>${d.deductionNoteNumber || d.noteNumber || "-"}</td>
          <td class="col-supplier">${d.supplierNames.join(", ") || "-"}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(d.serviceCharge || 0)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(d.kukuluban || 0)}</td>
          <td align="right">${new Intl.NumberFormat("id-ID").format(d.tabungan || 0)}</td>
          <td align="right"><strong>${new Intl.NumberFormat("id-ID").format(total)}</strong></td>
        </tr>
      `;
    })
    .join("");

  const totals = {
    sc: data.reduce((sum, r) => sum + (r.serviceCharge || 0), 0),
    kuk: data.reduce((sum, r) => sum + (r.kukuluban || 0), 0),
    tab: data.reduce((sum, r) => sum + (r.tabungan || 0), 0),
    grand: data.reduce((sum, r) => sum + (r.serviceCharge || 0) + (r.kukuluban || 0) + (r.tabungan || 0), 0)
  };

  const periodText = startDate && endDate 
    ? `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`
    : "Semua Periode";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${getHeadTagHtml("Laporan Ringkasan Potongan")}
      </head>
      <body>
        ${getHeaderHtml("Laporan Ringkasan Potongan Mitra")}
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Periode:</span> ${periodText}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="30">No</th>
              <th>Tanggal</th>
              <th>No. Nota</th>
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
              <td colspan="4" align="center">TOTAL KESELURUHAN</td>
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
          Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}
        </div>
      </body>
    </html>
  `;
};
