export type ReceiptType = 'import' | 'export';

export interface InventoryReceiptLean {
  _id: string;
  code: string;
  type: ReceiptType;
  date: string; // ISO
  supplierName?: string;
  receiverName?: string;
  reason: string;
  totalQuantity: number;
  totalAmount: number;
  createdBy?: string;
  details: Array<{
    _id: string;
    receiptId: string;
    bookId: { _id: string; title: string; stockQuantity: number };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
