export interface Product {
  id: string;
  name: string;
  code: string | null;
  supplierId: string | null;
  supplier?: {
    id?: string;
    name?: string;
  } | null;
  supplierName?: string;
}

export interface SelectedPrintItem extends Product {
  qty: number;
  supplierName: string;
}

export interface PrintQueueItem {
  id: string;
  name: string;
  code: string | null;
  qty: number;
  supplierId: string | null;
  supplier?: {
    name?: string;
  } | null;
}
