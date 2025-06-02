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
import { User } from '../../model/users-details.model';
import { ReviewService } from '../../service/review.service';
import { Review } from '../../model/review.model';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';
import { Author } from '../../model/author.model';
import { AuthorService } from '../../service/author.service';

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
    ToggleButtonModule,
    DotSeparatorPipe
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService]
})
export class DetailComponent implements OnInit {
  @Input() book!: BookDetails;
  isFavorite = false; // Trạng thái yêu thích
  books: BookDetails | undefined;
  relatedBooks: BookDetails[] = [];
  quantity: number = 1;
  authors: Author[] = [];
  showDialog = false;
  @ViewChild('cartDialog') cartDialog!: TemplateRef<any>; // Trỏ đến dialog template trong HTML
  showReviewDialog = false;
  reviews: Review[] = [];
  imageFile: File | null = null;
  imagePreview: string | null = null;
  selectedFiles: File[] = [];
  currentUserId: User | null = null; // gán từ AuthService hoặc localStorage
  hasReviewed = false;
  breadcrumbItems: any[] = [];
  currentCoverImage: string | null = null;

  review: Review = {
    productId: '', // gán từ input hoặc route
    name: '',
    comment: '',
    rating: 0,
    anonymous: false,
    image: '',
    userId: '' // thêm trường userId để lưu người đánh giá
  };
  averageRating = 0;
  totalReviews = 0;
  ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private cartService: CartService,
    private favoriteService: FavoritePageService,
    private messageService: MessageService,
    private reviewService: ReviewService,
    public authService: AuthService,
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {
    this.authorService.getAuthors().subscribe(data => {
      this.authors = data;
    });
    this.currentUserId = this.authService.getCurrentUser();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchBookDetails(id);
        this.bookService.getBookById(id).subscribe(book => {
          this.book = book;
          this.loadRelatedBooks(book.categoryName);
          this.getReviewsByProductId(id);
          this.breadcrumbItems = [
            { label: 'Trang chủ', url: '/' },
            { label: this.formatCategory(book.categoryName), url: `/category/${book.categoryName}` },
            { label: book.title }
          ];
        });
      }
    });
  }

  stripHtmlTags(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  generateAuthorId(authorName: string): string {
    return authorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  }

  formatCategory(name: string): string {
    switch (name) {
      case 'sach-trong-nuoc': return 'Sách Trong Nước';
      case 'truyen-tranh': return 'Truyện Tranh - Manga';
      case 'sach-tham-khao': return 'Sách Tham Khảo';
      case 'vpp-dung-cu-hoc-sinh': return 'VPP - Dụng cụ học tập';
      case 'do-choi': return 'Đồ chơi';
      case 'lam-dep': return 'Làm đẹp';
      case 'sach-ngoai-van': return 'Sách ngoại văn';
      default: return name;
    }
  }

  changeCover(imgUrl: string) {
    this.currentCoverImage = imgUrl;
  }

  get extraImagesCount(): number {
    return this.books?.images && this.books.images.length > 4
      ? this.books.images.length - 4
      : 0;
  }

  calculateRatingCounts() {
    // Reset
    this.ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const review of this.reviews) {
      const rating = review.rating;
      if (this.ratingCounts[rating] !== undefined) {
        this.ratingCounts[rating]++;
      }
    }
  }

  calculateAverageRating() {
    const totalReviews = this.reviews.length;
    if (totalReviews === 0) {
      this.averageRating = 0;
      return;
    }

    const totalStars = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = totalStars / totalReviews;
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

  getReviewsByProductId(productId: string) {
    this.reviewService.getReviews(productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.checkUserReviewed();
        this.calculateRatingCounts();
        this.calculateAverageRating();
      },
      error: (err) => {
        console.error('Lỗi lấy đánh giá:', err);
      }
    });
  }

  checkUserReviewed() {
    if (!this.currentUserId) {
      this.hasReviewed = false;
      return;
    }
    this.hasReviewed = this.reviews.some(r => r.userId === this.currentUserId?._id);
  }

  onFileSelected(event: Event, type: 'image') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (type === 'image') {
      this.imageFile = file;
      this.imagePreview = URL.createObjectURL(file);
    }
  }

  get totalRatings(): number {
    return Object.values(this.ratingCounts).reduce((a, b) => a + b, 0);
  }

  getPercent(star: number): number {
    const total = this.totalRatings;
    return total === 0 ? 0 : (this.ratingCounts[star] / total) * 100;
  }

  submitReview() {
    if (this.hasReviewed) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thông báo',
        detail: 'Bạn chỉ được đánh giá một lần cho sản phẩm này.'
      });
      return;
    }

    if (this.review.anonymous) {
      this.review.name = 'Ẩn danh';
    }

    if (this.book._id) {
      this.review.productId = this.book._id;
    }

    if (this.currentUserId) {
      this.review.userId = this.currentUserId._id;
    }

    this.reviewService.submitReview(this.review).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Gửi đánh giá thành công',
        });
        this.showReviewDialog = false;
        this.resetForm();
        this.getReviewsByProductId(this.review.productId); // load lại đánh giá mới
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
      image: '',
      userId: ''
    };
  }

  openReviewDialog() {
    if (!this.authService.isLoggedIn()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thông báo',
        detail: 'Chỉ có thành viên mới có thể viết nhận xét. Vui lòng đăng nhập hoặc đăng ký.'
      });
      return;
    }

    this.showReviewDialog = true;
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

  updateBookQuantity() {
  this.bookService.getBookById(this.book._id).subscribe((updatedBook) => {
    this.book.quantity = updatedBook.quantity; // 🔄 Cập nhật số lượng hiển thị
  });
}
}
