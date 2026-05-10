import { z } from "zod";

export const transactionRowSchema = z.object({
  supplierId: z.string().min(1, "Suplier harus dipilih"),
  revenue: z.number().min(0, "Pendapatan tidak boleh negatif"),
  barcode: z.number().min(0, "Barcode tidak boleh negatif"),
  cost: z.number().min(0, "Cost tidak boleh negatif"),
  serviceCharge: z.number().min(0).optional().default(0),
  kukuluban: z.number().min(0).optional().default(0),
  tabungan: z.number().min(0).optional().default(0),
  profit80: z.number(), // This is calculated on the client, but we can re-verify or just accept it
  profit20: z.number(),
  items: z.array(z.object({
    name: z.string(),
    qtyBeli: z.number(),
    qtyJual: z.number(),
    retureJual: z.number().optional().default(0)
  })).optional().default([]),
}).refine(data => data.revenue > 0 || data.cost > 0 || data.barcode > 0, {
  message: "Baris transaksi harus memiliki setidaknya satu nilai transaksi (Pendapatan/Cost/Barcode) yang lebih dari 0",
  path: ["revenue"]
});

export const saveTransactionSchema = z.object({
  isEditMode: z.boolean(),
  editNoteNumber: z.string().nullable(),
  noteNumber: z.string().min(1, "Nomor nota wajib diisi"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Format tanggal tidak valid"
  }),
  notes: z.string(),
  rows: z.array(transactionRowSchema).min(1, "Minimal harus ada satu transaksi")
}).refine(data => {
  if (data.isEditMode && !data.editNoteNumber) return false;
  return true;
}, {
  message: "Nomor nota lama wajib disertakan saat dalam mode edit",
  path: ["editNoteNumber"]
});

export type SaveTransactionData = z.infer<typeof saveTransactionSchema>;
