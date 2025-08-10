import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BookDetails } from '../model/books-details.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private API_URL = 'https://book-store-3-svnz.onrender.com/cart';
  private cartSubject = new BehaviorSubject<BookDetails[]>([]);
  private cart: BookDetails[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    if (this.authService.isLoggedIn()) {
      this.loadCart();
    }
  }

  /** Lấy cart từ server và đẩy vào BehaviorSubject */
  private loadCart(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.cartSubject.next([]);
      return;
    }
    this.http.get<BookDetails[]>(this.API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.cartSubject.next([...this.cart]);
      },
      error: (err) => console.error('Error loading cart:', err),
    });
  }

  getCart(): Observable<BookDetails[]> {
    const token = this.authService.getToken();
    return this.http.get<BookDetails[]>(this.API_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  /** Thêm sản phẩm vào giỏ */
  addToCart(book: BookDetails): void {
    this.http.post(
      `${this.API_URL}/${book._id}`,
      {},
      {
        headers: { 
          Authorization: `Bearer ${this.authService.getToken()}`,
          'Content-Type': 'application/json'
        },
      }
    ).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error adding to cart:', err),
    });
  }

  /** Cập nhật số lượng */
  updateQuantity(bookId: string, change: number): void {
    this.http.patch(
      `${this.API_URL}/${bookId}`,
      { change },
      {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` },
      }
    ).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error updating quantity:', err),
    });
  }

  /** Xóa 1 sản phẩm */
  removeFromCart(bookId: string): void {
    this.http.delete(`${this.API_URL}/${bookId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` },
    }).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error removing from cart:', err),
    });
  }

  /** Xóa toàn bộ giỏ */
  clearCart(): void {
    this.http.delete(this.API_URL, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` },
    }).subscribe({
      next: () => this.cartSubject.next([]),
      error: (err) => console.error('Error clearing cart:', err),
    });
  }
}
