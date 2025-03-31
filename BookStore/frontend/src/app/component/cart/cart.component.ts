import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { map, Observable } from 'rxjs';
import { BookDetails } from '../../model/books-details.model';
import { CartService } from '../../service/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, 
    MatButtonModule,
    FormsModule, // Cần để sử dụng [(ngModel)]
    
    // PrimeNG Modules
    TableModule,
    PaginatorModule,
    CheckboxModule,
    ButtonModule
    
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart$: Observable<BookDetails[]>
  totalPrice: number = 0;
  selectedBooks: BookDetails[] = [];

  constructor(
    private cartService: CartService,
    private router: Router
  ) {
    this.cart$ = this.cartService.getCart().pipe(
      map(cart => cart || [])
    );
  } 

  ngOnInit(): void {
    this.cart$.subscribe(cart => {
      this.totalPrice = cart.reduce((sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1), 0);
    });
  }

  // tăng số lượng
  increaseQuantity(book: BookDetails): void {
    this.cartService.updateQuantity(book._id, 1);
  }

  // giảm số lượng
  decreaseQuantity(book: BookDetails): void {
    if(book.quantity && book.quantity > 1) {
      this.cartService.updateQuantity(book._id, -1);
    }
  }

  removeItem(bookId: string): void {
    this.cartService.removeFromCart(bookId);
  }

  onCheckboxChange(book: BookDetails, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedBooks.push(book);
    } else {
      this.selectedBooks = this.selectedBooks.filter(b => b._id !== book._id);
    }
  }
  
  removeAllSelected(): void {
    this.selectedBooks.forEach(book => this.removeItem(book._id));
    this.selectedBooks = [];
  }
  
  deselectAll(): void {
    this.selectedBooks = [];
  }

  goToCheckout() {
    console.log('🔄 Chuyển sang trang thanh toán với giỏ hàng:', this.selectedBooks);
    if (this.selectedBooks.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    localStorage.setItem('cart', JSON.stringify(this.selectedBooks));
    localStorage.setItem('totalAmount', JSON.stringify(this.totalPrice));
  
    this.router.navigate(['/checkout'], { 
      state: { cart: this.selectedBooks, total: this.calculateTotalSelectedPrice() } 
    });
  }
  
  // Tính tổng tiền chỉ cho các sách đã chọn
  calculateTotalSelectedPrice(): number {
    return this.selectedBooks.reduce((sum, item) => sum + (item.flashsale_price || item.price) * (item.quantity || 1), 0);
  }
}
