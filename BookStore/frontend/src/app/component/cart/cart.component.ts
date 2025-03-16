import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { BookDetails } from '../../model/books-details.model';
import { CartService } from '../../service/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart$: Observable<BookDetails[]>
  totalPrice: number = 0;

  constructor(
    private cartService: CartService
  ) {
    this.cart$ = this.cartService.getCart();
  }

  ngOnInit(): void {
    this.cart$.subscribe(cart => {
      this.totalPrice = cart.reduce((sum, item) => sum + (item.flashsale_price || item.price) * (item.quatity || 1), 0);
    });
  }

  // tăng số lượng
  increaseQuantity(book: BookDetails): void {
    this.cartService.updateQuantity(book._id, 1);
  }

  // giảm số lượng
  decreaseQuantity(book: BookDetails): void {
    if(book.quatity && book.quatity > 1) {
      this.cartService.updateQuantity(book._id, -1);
    }
  }

  removeItem(bookId: string): void {
    this.cartService.removeFromCart(bookId);
  }
}
