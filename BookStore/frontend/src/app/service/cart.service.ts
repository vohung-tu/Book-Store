import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { BookDetails } from '../model/books-details.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private API_URL = 'http://https://book-store-3-svnz.onrender.com//cart';
  private cartSubject = new BehaviorSubject<BookDetails[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    if (this.authService.isLoggedIn()) {
      this.loadCart();
    }
  }

  /** fetch từ server và next vào subject */
  private loadCart(): void {
    const token = this.authService.getToken();
    if (!token) return this.cartSubject.next([]);

    this.http.get<BookDetails[]>(this.API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: cart => this.cartSubject.next(cart ?? []),
      error: err => console.error('Error loading cart:', err),
    });
  }

  getCart(): Observable<BookDetails[]> {
    return this.cart$;
  }

  /** Thêm sản phẩm vào giỏ */
  addToCart(book: BookDetails): Observable<any> {
    return this.http.post(`${this.API_URL}/${book._id}`, {}, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    }).pipe(
      tap(() => this.loadCart())
    );
  }

  updateQuantity(cartItemId: string, change: number): Observable<any> {
    // Optimistic update
    const prev = this.cartSubject.value;
    const next = prev.map(it =>
      it.cartItemId === cartItemId
        ? { ...it, quantity: Math.max(1, (it.quantity || 1) + change) }
        : it
    );
    this.cartSubject.next(next);

    return this.http.patch(`${this.API_URL}/${cartItemId}`, { change }, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    }).pipe();
  }

  /** Xóa 1 sản phẩm */
  removeFromCart(cartItemId: string): Observable<any> {
    const prev = this.cartSubject.value;
    const next = prev.filter(it => it.cartItemId !== cartItemId);
    this.cartSubject.next(next);

    return this.http.delete(`${this.API_URL}/${cartItemId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    })/* .pipe(catchError(err => { this.cartSubject.next(prev); return throwError(() => err); })) */;
  }

  /** Xóa toàn bộ giỏ */
  clearCart(): Observable<any> {
    return this.http.delete(this.API_URL, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` },
    }).pipe(
      tap(() => this.cartSubject.next([]))
    );
  }
}
