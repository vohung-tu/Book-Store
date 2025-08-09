import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { BookDetails } from '../model/books-details.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private API_URL = 'https://book-store-3-svnz.onrender.com/cart';
  private cart: BookDetails[] = [];
  private cartSubject = new BehaviorSubject<BookDetails[]>([]);

  constructor(private authService: AuthService, private http: HttpClient) {
    this.loadCart();
    this.authService.authStatusChanged?.subscribe((loggedIn: boolean) => {
      if (loggedIn) {
        this.mergeSessionCartToLocal();
      } else {
        this.loadCart(); // reload session cart
      }
    });
  }

  private loadCart(): void {
  this.http.get<BookDetails[]>('/api/cart').subscribe(cart => {
    this.cart = cart;
    this.cartSubject.next([...this.cart]);
  });
}

  private saveCart(): void {
    const storage = this.authService.isAuthenticated() ? localStorage : sessionStorage;
    storage.setItem('cart', JSON.stringify(this.cart));
    this.cartSubject.next([...this.cart]);
  }

  getCart(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(this.API_URL);
  }

  addToCart(book: BookDetails): void {
    this.http.post(
      `${this.API_URL}/${book._id}`,
      {},
      {
        headers: { Authorization: `Bearer ${this.authService.getToken()}` },
      }
    ).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.error('Error adding to cart:', err),
    });
  }

  updateQuantity(bookId: string, change: number): void {
    const book = this.cart.find(item => item._id === bookId);
    if (book) {
      const newQuantity = Math.max(1, (book.quantity || 1) + change);
      this.http.patch(`${this.API_URL}/${bookId}`, { quantity: newQuantity }).subscribe(() => {
        this.loadCart();
      });
    }
  }

  removeFromCart(bookId: string): void {
    this.http.delete(`${this.API_URL}/${bookId}`).subscribe(() => {
      this.loadCart();
    });
  }

  clearCart(): void {
    this.http.delete(this.API_URL).subscribe(() => {
      this.cart = [];
      this.cartSubject.next([]);
    });
  }

  // 🔁 Merge session cart into localStorage after login
  private mergeSessionCartToLocal(): void {
    const sessionCartData = sessionStorage.getItem('cart');
    const sessionCart: BookDetails[] = sessionCartData ? JSON.parse(sessionCartData) : [];

    // Load local cart
    const localCartData = localStorage.getItem('cart');
    const localCart: BookDetails[] = localCartData ? JSON.parse(localCartData) : [];

    // Merge logic
    sessionCart.forEach(sessionItem => {
      const existing = localCart.find(item => item._id === sessionItem._id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + (sessionItem.quantity || 1);
      } else {
        localCart.push({ ...sessionItem });
      }
    });

    // Save merged cart
    localStorage.setItem('cart', JSON.stringify(localCart));
    sessionStorage.removeItem('cart');
    this.cart = localCart;
    this.cartSubject.next([...this.cart]);
  }
}
