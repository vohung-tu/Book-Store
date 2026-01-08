import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { BookDetails } from '../model/books-details.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FavoritePageService {
  private base = 'https://book-store-3-svnz.onrender.com/wishlist';

  private favoritesSubject = new BehaviorSubject<BookDetails[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Tạo header Authorization */
  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token'); // đúng với AuthService
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /** Load wishlist */
  loadWishlist() {
    return this.http.get<any>(this.base, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(res => {
        // ✅ LẤY ĐÚNG FIELD
        this.favoritesSubject.next(res || []);
      })
    );
  }

  /** Add */
  addToFavorites(bookId: string) {
    return this.http.post(
      `${this.base}/${bookId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /** Remove */
  removeFromFavorites(bookId: string) {
    return this.http.delete(
      `${this.base}/${bookId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Clear when logout */
  clearWishlist() {
    this.favoritesSubject.next([]);
  }
}
