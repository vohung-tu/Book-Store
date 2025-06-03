import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BookDetails } from '../../model/books-details.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { FavoritePageService } from '../../service/favorite-page.service';
import { CartService } from '../../service/cart.service';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../service/review.service';
import { Review } from '../../model/review.model';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';

@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ButtonModule,
    RippleModule,
    RatingModule,
    FormsModule,
    DotSeparatorPipe
    
  ],
  templateUrl: './product-item.component.html',
  styleUrls: ['./product-item.component.scss'],
  providers: [MessageService]
})
export class ProductItemComponent implements OnInit{
  @Input() book!: BookDetails;
  @Input() isUpcomingRelease: boolean = false;
  @Output() showToast = new EventEmitter<any>();
  isFavorite = false;
  averageRating = 0;
  reviews: Review[] = [];

  review: Review = {
    productId: '', // gán từ input hoặc route
    name: '',
    comment: '',
    rating: 0,
    anonymous: false,
    image: '',
    userId: ''
  };

  constructor(
    private favoriteService: FavoritePageService,
    private cartService: CartService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    if (this.book && this.book._id) {
      this.reviewService.getReviews(this.book._id).subscribe(data => {
        this.reviews = data;
        const total = this.reviews.length;
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.averageRating = total > 0 ? sum / total : 0;
      });
    }
  }

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
