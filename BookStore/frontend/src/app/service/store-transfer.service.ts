import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StoreTransferItem {
  bookId: string;
  quantity: number;
}

export interface StoreTransferPayload {
  fromWarehouse: string;
  toStore: string;
  items: StoreTransferItem[];
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class StoreTransferService {
  private base = 'http://localhost:3000/inventory/store-transfer';

  constructor(private http: HttpClient) {}

  create(body: StoreTransferPayload) {
    return this.http.post(this.base, body);
  }

  list(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }
}
