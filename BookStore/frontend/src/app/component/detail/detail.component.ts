import { Component, Input, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { BooksService } from '../../service/books.service';
import { BookDetails } from '../../model/books-details.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { CartService } from '../../service/cart.service';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { FavoritePageService } from '../../service/favorite-page.service';
import { RatingModule } from 'primeng/rating';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ProductItemComponent } from '../product-item/product-item.component';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TextareaModule } from 'primeng/textarea';
import { HttpClient } from '@angular/common/http';
import { ReviewService } from '../../service/review.service';
import { Review } from '../../model/review.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule, 
    MatIconModule,
    MatInputModule, 
    RouterModule,
    ButtonModule,
    ToastModule,
    RippleModule,
    RatingModule,
    BreadcrumbComponent,
    ProductItemComponent,
    FormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToggleButtonModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService]
})

export class DetailComponent implements OnInit{
  @Input() book!: BookDetails;
  isFavorite = false; // Trạng thái yêu thích
  books: BookDetails | undefined;
  relatedBooks: BookDetails[] = [];
  quantity: number = 1;
  showDialog = false;
  @ViewChild('cartDialog') cartDialog!: TemplateRef<any>; // Trỏ đến dialog template trong HTML
  showReviewDialog = false;
  reviews: Review[] = [];

  review: Review = {
    productId: '', // gán từ input hoặc route
    name: '',
    comment: '',
    rating: 0,
    anonymous: false,
  };
  averageRating = 0;
  totalReviews = 0;
  ratingCounts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private cartService: CartService,
    private favoriteService: FavoritePageService,
    private messageService: MessageService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    // Lắng nghe sự thay đổi của tham số 'id' trong URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchBookDetails(id);
        this.bookService.getBookById(id).subscribe(book => {
          this.book = book;
          this.loadRelatedBooks(book.categoryName);
        });
      }
    });
  }

  loadRelatedBooks(categoryName: string) {
    this.bookService.getProductsByCategory(categoryName).subscribe(allBooks => {
      this.relatedBooks = allBooks.filter(b => b._id !== this.books?._id); // loại trừ sách đang xem
    });
  }

  fetchBookDetails(id: string): void {
    this.bookService.getBookById(id).subscribe((data) => {
      this.books = data;
    });
  }

  openReviewDialog() {
    console.log('abc');
  } 

  submitReview() {
    if (this.review.anonymous) {
      this.review.name = 'Ẩn danh';
    }

    if (this.book.id) {
      this.review.productId = this.book.id;
    }

    this.reviewService.submitReview(this.review).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Gửi đánh giá thành công',
        });
        this.showReviewDialog = false;
        this.resetForm();
        this.getReviews(); // gọi lại nếu hiển thị danh sách
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể gửi đánh giá',
        });
        console.error(err);
      },
    });
  }

  resetForm() {
    this.review = {
      productId: this.review.productId,
      name: '',
      comment: '',
      rating: 0,
      anonymous: false,
    };
  }

  getReviews() {
    this.reviewService.getReviews(this.review.productId).subscribe(data => {
      this.reviews = data;
    });
  }

  // Hàm tăng số lượng
  increaseQty(): void {
    this.cartService.updateQuantity(this.book._id, 1);
  }

  decreaseQty(): void {
    this.cartService.updateQuantity(this.book._id, -1);
  }

  get quantities(): number {
    return this.book.quantity || 1;
  }

  addToCart(): void {
    if (!this.book) {
      console.error('Book data is undefined');
      return;
    }
    this.cartService.addToCart({ ...this.book, quantity: this.quantity });
    this.messageService.add({ severity: 'success', summary: 'Thêm thành công', detail: 'Đã thêm vào giỏ hàng thành công!', key: 'tr', life: 3000 });
  }

  toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    if (this.isFavorite) {
      this.favoriteService.addToFavorites(this.book);
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Thành công', 
        detail: 'Đã thêm vào trang yêu thích',
        key: 'tr',
        life: 2000
      });
    } else {
      this.favoriteService.removeFromFavorites(this.book._id);
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Thông báo', 
        detail: 'Đã xóa khỏi trang yêu thích',
        key: 'tr',
        life: 2000
       });
    }
  }
}
