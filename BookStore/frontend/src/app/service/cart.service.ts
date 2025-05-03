import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { BookDetails } from '../model/books-details.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cart: BookDetails[] = [];
  private cartSubject = new BehaviorSubject<BookDetails[]>([]);

  constructor(private authService: AuthService) {
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
    if (typeof window !== 'undefined') {
      const cartData = sessionStorage.getItem('cart');
      if (cartData) {
        const storage = this.authService.isAuthenticated() ? localStorage : sessionStorage;
        const cartData = storage.getItem('cart');
        this.cart = cartData ? JSON.parse(cartData) : [];
        this.cartSubject.next([...this.cart]);
      }
    }
  }

  private saveCart(): void {
    const storage = this.authService.isAuthenticated() ? localStorage : sessionStorage;
    storage.setItem('cart', JSON.stringify(this.cart));
    this.cartSubject.next([...this.cart]);
  }

  getCart(): Observable<BookDetails[]> {
    return this.cartSubject.asObservable().pipe(map(items => items || []));
  }

  addToCart(book: BookDetails): void {
    const existingBook = this.cart.find(item => item._id === book._id);
    if (existingBook) {
      existingBook.quantity = (existingBook.quantity || 1) + 1;
    } else {
      this.cart.push({ ...book, quantity: 1 });
    }
    this.saveCart();
  }

  updateQuantity(bookId: string, change: number): void {
    const book = this.cart.find(item => item._id === bookId);
    if (book) {
      book.quantity = Math.max(1, (book.quantity || 1) + change);
      this.saveCart();
    }
  }

  removeFromCart(bookId: string): void {
    this.cart = this.cart.filter(item => item._id !== bookId);
    this.saveCart();
  }

  clearCart(): void {
    this.cart = [];
    this.saveCart();
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
