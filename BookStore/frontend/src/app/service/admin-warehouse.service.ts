import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Warehouse {
  _id?: string;
  code?: string;
  name: string;
  region: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam';
  address?: string;
  managerName: string;
  managerEmail: string;
  managerPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminWarehouseService {
  private base = 'https://book-store-3-svnz.onrender.com/warehouse-admin'; // BE controller path

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<Warehouse[]>(this.base);
  }
  get(id: string) {
    return this.http.get<Warehouse>(`${this.base}/${id}`);
  }
  create(data: Warehouse) {
    return this.http.post<Warehouse>(this.base, data);
  }
  update(id: string, data: Partial<Warehouse>) {
    return this.http.put<Warehouse>(`${this.base}/${id}`, data);
  }
  remove(id: string) {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
