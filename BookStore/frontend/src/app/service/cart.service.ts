import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { BookDetails } from '../model/books-details.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cart: BookDetails[] = [];
  private cartSubject = new BehaviorSubject<BookDetails[]>([]);

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {

    if (typeof window !== 'undefined' && window.localStorage) {
      const cartData = localStorage.getItem('cart');
      this.cart = cartData ? JSON.parse(cartData) : [];
      this.cartSubject.next(this.cart);
    } else {
      console.warn('localStorage is not available');
      this.cart = [];
    }
  }

  getCart(): Observable<BookDetails[]> {
    return this.cartSubject.asObservable().pipe(
      map(items => items || [])
    );
  }

  addToCart(book: BookDetails): void {
    const existingBook = this.cart.find(item => item._id === book._id);
    if (existingBook) {
      existingBook.quantity = (existingBook.quantity || 1) + 1;
    } else {
      this.cart.push({ ...book, quantity: 1 });
    }
    this.updateCart();
  }

  updateQuantity(bookId: string, change: number): void {
    const book = this.cart.find(item => item._id === bookId);
    if (book) {
      book.quantity = Math.max(1, (book.quantity || 1) + change);
      this.updateCart();
    }
  }

  removeFromCart(bookId: string): void {
    this.cart = this.cart.filter(item => item._id !== bookId);
    this.updateCart();
  }

  clearCart(): void {
    this.cart = [];
    this.updateCart();
  }

  private updateCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.cartSubject.next([...this.cart]);
  }
}
