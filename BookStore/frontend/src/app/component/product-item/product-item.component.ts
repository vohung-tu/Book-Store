import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BookDetails } from '../../model/books-details.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { FavoritePageService } from '../../service/favorite-page.service';
import { CartService } from '../../service/cart.service';

@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    RippleModule
  ],
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss'],
  providers: [MessageService]
})
export class ProductItemComponent {
  @Input() book!: BookDetails;
  isFavorite = false;
  @Output() showToast = new EventEmitter<any>();

  constructor(
    private favoriteService: FavoritePageService,
    private messageService: MessageService,
    private cartService: CartService
  ) {}

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    if (this.isFavorite) {
      this.favoriteService.addToFavorites(this.book);
      this.showToast.emit({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã thêm vào trang yêu thích'
      });
    } else {
      this.favoriteService.removeFromFavorites(this.book._id);
      this.showToast.emit({
        severity: 'warn',
        summary: 'Thông báo',
        detail: 'Đã xóa khỏi trang yêu thích'
      });
    }
  }

  addToCart(): void {
    if (!this.book) return;
    this.cartService.addToCart({ ...this.book });
    this.showToast.emit({
      severity: 'success',
      summary: 'Thêm thành công',
      detail: 'Đã thêm vào giỏ hàng thành công!'
    });
  }

}
