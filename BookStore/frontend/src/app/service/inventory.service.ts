import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateExportDto, CreateImportDto, InventoryReceipt, Paginated } from "../model/inventory.model";

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private base = 'https://book-store-3-svnz.onrender.com/inventory';


  constructor(private http: HttpClient) {}


  listReceipts(params: { type?: 'import'|'export'; from?: string; to?: string; q?: string; page?: number; limit?: number }): Observable<Paginated<InventoryReceipt>> {
    let p = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<Paginated<InventoryReceipt>>(`${this.base}/receipts`, { params: p });
  }


  getReceipt(id: string): Observable<InventoryReceipt> {
    return this.http.get<InventoryReceipt>(`${this.base}/receipts/${id}`);
  }


  createImport(body: CreateImportDto): Observable<InventoryReceipt> {
    return this.http.post<InventoryReceipt>(`${this.base}/import`, body);
  }


  createExport(body: CreateExportDto): Observable<InventoryReceipt> {
    return this.http.post<InventoryReceipt>(`${this.base}/export`, body);
  }

  getReceiptById(id: string) {
    return this.http.get<any>(`https://book-store-3-svnz.onrender.com/inventory/receipts/${id}`);
  }
}