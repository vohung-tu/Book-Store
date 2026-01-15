// src/app/service/book-lite.service.ts
// (Lấy danh sách sách tối giản cho dropdown – an toàn với nhiều format trả về)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface BookLite {
  _id: string;
  title: string;
  stockQuantity: number;
  code: string;
  price?: number; 
  flashsale_price?: number;
}

@Injectable({ providedIn: 'root' })
export class BookLiteService {
  constructor(private http: HttpClient) {}

  /**
   * Trả về mảng BookLite, bất kể API trả dạng nào:
   *   - [ ... ]
   *   - { items: [...] }
   *   - { data: [...] }
   *   - { results: [...] }
   */
  getAllLite(): Observable<BookLite[]> {
    // Nếu BE có /books/lite thì đổi URL thành '/api/books/lite'
    const url = 'https://book-store-3-svnz.onrender.com/books?fields=_id,title,stockQuantity&limit=1000';

    return this.http.get<any>(url).pipe(
      map((res) => {
        let arr: any[] = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.items)) arr = res.items;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.results)) arr = res.results;

        const mapped = arr.map((b) => ({
          _id: b._id,
          title: b.title,
          stockQuantity: (b.stockQuantity ?? b.quantity ?? 0) as number,
        })) as BookLite[];

        // sort nhẹ theo tiêu đề
        mapped.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        return mapped;
      }),
      // Không làm vỡ UI nếu lỗi mạng/API
      catchError(() => of([]))
    );
  }
  searchForTransfer(search = '') {
    return this.http.get<BookLite[]>(
      `https://book-store-3-svnz.onrender.com/books/lite/transfer`,
      { params: { search } }
    );
  }

   findByCode(code: string): Observable<BookLite | null> {
    if (!code) return of(null);

    const url = `https://book-store-3-svnz.onrender.com/books/lite/by-code/${encodeURIComponent(code)}`;

    return this.http.get<any>(url).pipe(
      map((res) => {
        // BE có thể trả: object | { data } | { item }
        const b =
          res?.data ??
          res?.item ??
          (Array.isArray(res) ? res[0] : res);

        if (!b) return null;

        return {
          _id: b._id,
          title: b.title,
          code: b.code,
          stockQuantity: (b.stockQuantity ?? b.quantity ?? 0) as number,
          price: b.price,
          flashsale_price: b.flashsale_price,
        } as BookLite;
      }),
      catchError(() => of(null))
    );
  }
}
