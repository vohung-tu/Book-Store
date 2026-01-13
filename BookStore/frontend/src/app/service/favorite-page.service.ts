import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { BookDetails } from '../model/books-details.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FavoritePageService {
  private base = 'http://localhost:3000/wishlist';

  private favoritesSubject = new BehaviorSubject<BookDetails[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token'); 
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /** Load wishlist từ server */
  loadWishlist(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(this.base, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(books => {
        this.favoritesSubject.next(books || []);
      }),
      catchError(err => {
        console.error('Lỗi load wishlist:', err);
        return of([]);
      })
    );
  }

  /** Thêm vào yêu thích */
  addToFavorites(bookId: string) {
    return this.http.post(`${this.base}/${bookId}`, {}, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      // Sau khi thêm thành công, load lại danh sách để cập nhật UI
      tap(() => this.loadWishlist().subscribe())
    );
  }

  /** Xóa khỏi yêu thích */
  removeFromFavorites(bookId: string) {
    return this.http.delete(`${this.base}/${bookId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Lấy danh sách hiện tại trong Subject
        const currentFavs = this.favoritesSubject.value;
        // Lọc bỏ item vừa xóa
        const updatedFavs = currentFavs.filter(b => b._id !== bookId && b.id !== bookId);
        // Đẩy danh sách mới vào Subject để tất cả Component (Navbar, Home, Wishlist) cùng cập nhật
        this.favoritesSubject.next(updatedFavs);
      })
    );
  }

  /** Xóa sạch khi logout */
  clearWishlist() {
    this.favoritesSubject.next([]);
  }

  /** Kiểm tra nhanh xem sách có trong wishlist không */
  isBookInWishlist(bookId: string): boolean {
    return this.favoritesSubject.value.some(b => b._id === bookId);
  }
}