export type ReceiptType = 'import' | 'export';


export interface InventoryReceiptDetail {
  _id?: string;
  receiptId?: string;
  bookId: any; // { _id, title, stockQuantity } hoặc string cho request
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}


export interface InventoryReceipt {
  _id?: string;
  code: string;
  type: ReceiptType;
  date: string; // ISO
  supplierName?: string;
  receiverName?: string;
  reason?: string;
  totalQuantity: number;
  totalAmount: number;
  createdBy?: string;
  details: InventoryReceiptDetail[];
}


export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}


export interface CreateImportDto {
  date: string; 
  supplierName?: string; 
  reason?: string; 
  lines: Array<{ bookId: string; quantity: number; unitPrice?: number }>;
  userId?: string;
}
export interface CreateExportDto {
  date: string; 
  receiverName?: 
  string; reason?: string; 
  lines: Array<{ bookId: string; quantity: number; unitPrice?: number }>; 
  userId?: string;
}