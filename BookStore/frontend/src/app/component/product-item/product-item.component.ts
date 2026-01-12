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
import { AuthorService } from '../../service/author.service';
import { AuthService } from '../../service/auth.service';
import { HttpClient } from '@angular/common/http';

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
  @Input() book!: BookDetails; // "!"" được gán trước khi sử dụng để sau khi sử dụng đừng báo lỗi undefined 
  @Input() isUpcomingRelease: boolean = false;
  @Output() showToast = new EventEmitter<any>();
  favoriteBooks: BookDetails[] = [];
  isFavorite = false;
  averageRating = 0;
  reviews: Review[] = [];
  authorName: string | null = null;
  authorId: string | null = null; 
  supplierName: string | null = null;

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
    private reviewService: ReviewService,
    private authorService: AuthorService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    if (!this.book || !this.book._id) return;

    // ===== TÁC GIẢ =====
    this.authorName = null;
    this.authorId = null;

    if (this.book.author) {
      if (typeof this.book.author === 'object') {
        this.authorName = this.book.author.name ?? null;
        this.authorId = this.book.author._id ?? null;
      }
      // Chưa populate → gọi API
      else if (typeof this.book.author === 'string') {
        this.authorService.getAuthorById(this.book.author).subscribe({
          next: (author) => {
            this.authorName = author?.name ?? null;
            this.authorId = author?._id ?? null;
          },
          error: () => {
            this.authorName = null;
            this.authorId = null;
          }
        });
      }
    }
    
    if (this.book.supplierId) {
      if (typeof this.book.supplierId === 'string') {
        // Gọi API để lấy thông tin NCC từ ID
        this.http.get<any>(`https://book-store-3-svnz.onrender.com/suppliers/${this.book.supplierId}`)
          .subscribe({
            next: (res) => {
              this.supplierName = res?.name || null;
            },
            error: () => this.supplierName = null
          });
      } else if (typeof this.book.supplierId === 'object') {
        this.supplierName = (this.book.supplierId as any).name;
      }
    }

    // ===== ĐÁNH GIÁ =====
    this.reviewService.getReviews(this.book._id).subscribe(data => {
      this.reviews = data;
      const total = data.length;
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      this.averageRating = total ? sum / total : 0;
    });

    // ===== YÊU THÍCH =====
    this.favoriteService.favorites$.subscribe(favs => {
      this.isFavorite = favs.some(f => f._id === this.book._id);
    });
  }

  get displayContributor() {
    // 1. Ưu tiên Tác giả
    if (this.authorName && this.authorName.trim() !== '' && this.authorName !== 'Không rõ') {
      return { label: 'Tác giả', name: this.authorName };
    }

    // 2. Nếu không có tác giả, dùng supplierName vừa lấy được
    if (this.supplierName) {
      return { label: 'NCC', name: this.supplierName };
    }

    return null;
  }

  toggleFavorite(book: BookDetails) {
    if (!this.authService.isLoggedIn()) {
      this.showToast.emit({
        severity: 'warn',
        summary: 'Chưa đăng nhập',
        detail: 'Vui lòng đăng nhập để thêm vào trang yêu thích'
      });
      return;
    }

    if (!this.isFavorite) {
      this.favoriteService.addToFavorites(book._id).subscribe({
        next: () => {
          this.isFavorite = true;
          this.favoriteService.loadWishlist().subscribe();

          this.showToast.emit({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã thêm vào yêu thích'
          });
        },
        error: (err) => {
          console.error(err);
          this.showToast.emit({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể thêm vào yêu thích'
          });
        }
      });
    } else {
      this.favoriteService.removeFromFavorites(book._id).subscribe({
        next: () => {
          this.isFavorite = false;
          this.favoriteService.loadWishlist().subscribe();

          this.showToast.emit({
            severity: 'warn',
            summary: 'Đã xóa',
            detail: 'Đã xóa khỏi yêu thích'
          });
        }
      });
    }
  }

  addToCart(): void {
    if (!this.book) return;

    // ===== GUEST =====
    if (!this.authService.isLoggedIn()) {
      this.cartService.addToLocalCart(this.book);

      this.showToast.emit({
        severity: 'success',
        summary: 'Thêm thành công',
        detail: 'Đã thêm vào giỏ hàng!'
      });

      return;
    }

    // ===== USER =====
    this.cartService.addToCart(this.book).subscribe({
      next: () => {
        this.showToast.emit({
          severity: 'success',
          summary: 'Thêm thành công',
          detail: 'Đã thêm vào giỏ hàng!'
        });
      },
      error: (err) => {
        console.error('Add to cart failed:', err);

        this.showToast.emit({
          severity: 'error',
          summary: 'Lỗi',
          detail: err?.error?.message || 'Không thể thêm sản phẩm'
        });
      }
    });
  }


}
