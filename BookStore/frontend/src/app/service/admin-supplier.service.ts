import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Supplier {
  _id?: string;
  code?: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminSupplierService {
  private base = 'https://book-store-3-svnz.onrender.com/suppliers';

  constructor(private http: HttpClient) {}

  list(): Observable<Supplier[]> { return this.http.get<Supplier[]>(this.base); }
  get(id: string) { return this.http.get<Supplier>(`${this.base}/${id}`); }
  create(data: Supplier) { return this.http.post<Supplier>(this.base, data); }
  update(id: string, data: Supplier) { return this.http.put<Supplier>(`${this.base}/${id}`, data); }
  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }

  exportExcel() {
    return this.http.get(`${this.base}/export/excel`, { responseType: 'blob' });
  }

  importExcel(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}/import/excel`, form);
  }
}
