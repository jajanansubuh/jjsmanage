import { z } from "zod";

export const transactionRowSchema = z.object({
  supplierId: z.string().min(1, "Suplier harus dipilih"),
  revenue: z.number().min(0, "Pendapatan tidak boleh negatif").optional().default(0),
  barcode: z.number().min(0, "Barcode tidak boleh negatif").optional().default(0),
  cost: z.number().min(0, "Cost tidak boleh negatif").optional().default(0),
  serviceCharge: z.number().min(0).optional().default(0),
  kukuluban: z.number().min(0).optional().default(0),
  tabungan: z.number().min(0).optional().default(0),
  profit80: z.number().optional().default(0),
  profit20: z.number().optional().default(0),
  items: z.array(z.object({
    name: z.string().optional().default("Produk"),
    qtyBeli: z.number().optional().default(0),
    qtyJual: z.number().optional().default(0),
    retureJual: z.number().optional().default(0)
  })).optional().default([]),
});

export const saveTransactionSchema = z.object({
  isEditMode: z.boolean().optional().default(false),
  editNoteNumber: z.string().nullable().optional(),
  noteNumber: z.string().min(1, "Nomor nota wajib diisi"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Format tanggal tidak valid"
  }),
  notes: z.string().nullable().optional(),
  cashierIds: z.array(z.string()).optional(),
  rows: z.array(transactionRowSchema).min(1, "Minimal harus ada satu transaksi")
}).refine(data => {
  if (data.isEditMode && !data.editNoteNumber) return false;
  return true;
}, {
  message: "Nomor nota lama wajib disertakan saat dalam mode edit",
  path: ["editNoteNumber"]
});

export type SaveTransactionData = z.infer<typeof saveTransactionSchema>;
