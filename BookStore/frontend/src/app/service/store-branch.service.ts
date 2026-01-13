import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface StoreBranch {
  _id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  region: string;
  phone?: string;
  mapUrl?: string;
  warehouse?: any;
}

@Injectable({ providedIn: 'root' })
export class StoreBranchService {
  private base = `http://localhost:3000/store-branches`;

  constructor(private http: HttpClient) {}

  list(): Observable<StoreBranch[]> {
    return this.http.get<StoreBranch[]>(this.base);
  }

  getNearest(lat: number, lng: number, limit = 5): Observable<StoreBranch[]> {
    let params = new HttpParams()
      .set('lat', lat)
      .set('lng', lng)
      .set('limit', limit);
    return this.http.get<StoreBranch[]>(`${this.base}/nearest`, { params });
  }

  updateInventory(branchId: string, bookId: string, quantity: number) {
    return this.http.patch(`${this.base}/inventory`, { branchId, bookId, quantity });
  }

  getAvailable(bookId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/available/${bookId}`);
  }

  create(data: Partial<StoreBranch>): Observable<StoreBranch> {
    return this.http.post<StoreBranch>(this.base, data);
  }

  update(id: string, data: Partial<StoreBranch>): Observable<StoreBranch> {
    return this.http.put<StoreBranch>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

}
