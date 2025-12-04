import { Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { BooksService } from '../../service/books.service';
import { BookDetails } from '../../model/books-details.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { CartService } from '../../service/cart.service';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { MessageService, SelectItem } from 'primeng/api';
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

import { AuthorService } from '../../service/author.service';
import { Author } from '../../model/author.model';
import { HttpClient } from '@angular/common/http';
import { catName, catSlug } from '../category/category.helpers';
import { InventoryService } from '../../service/inventory.service';
import {  DropdownModule } from 'primeng/dropdown';

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
    DotSeparatorPipe,
    DropdownModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MessageService]
})
export class DetailComponent implements OnInit {
  @Input() book!: BookDetails;
  @Input() author: Author | null = null;
  isFavorite = false; // Trạng thái yêu thích
  books: BookDetails | undefined;
  relatedBooks: BookDetails[] = [];
  quantity: number = 1;
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
  isLoadingRelated = false;
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
  authorId!: string;
  authors: Author[] = [];
  product: any;
  summary: string = '';
  showSummary: boolean = false;
  loadingSummary: boolean = false;

  branchStocks: { branchName: string; quantity: number }[] = [];
  selectedBranch: string | null = null;
  selectedBranchStock: { branchName: string; quantity: number } | null = null;
  showStoreDialog = false;
  storeStocks: any[] = [];

  showAddressDialog = false;
  selectedAddress: any = null;
  addresses: any[] = [];
  filteredAddresses: any[] = [];
  addressSearch = '';
  addingNew = false;
  newAddress = { full: '' };

  deliveryTime = '';
  shippingFee = 0;
  productId!: string;

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private cartService: CartService,
    private favoriteService: FavoritePageService,
    private messageService: MessageService,
    private reviewService: ReviewService,
    public authService: AuthService,
    private authorService: AuthorService,
    private inventoryService: InventoryService,
    private http: HttpClient,
    private router: Router 
  ) {}
  //ham ngOnInit chạy xong thì mới load dữ liệu lên component
  ngOnInit(): void {
    this.authorService.getAuthors().subscribe(data => {
      this.authors = data;
    });
    const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.getAuthorsAndProduct(id);
      }
    this.route.paramMap.subscribe(params => {
      const bookId = params.get('id');

      if (bookId) {
        this.productId = bookId;
        this.loadBookDetails(bookId);
        this.recordView(bookId);
      }
    });
    this.currentUserId = this.authService.getCurrentUser();
    
  }

  recordView(bookId: string) {
    console.log("Record view:", bookId);
    const user = JSON.parse(localStorage.getItem('user')!);
    if (!user?._id) return;

    this.http.post('https://book-store-3-svnz.onrender.com/view-history/record', {
      userId: user._id,
      bookId: bookId
    }).subscribe();
  }

  // 📖 Tải thông tin sách
  private loadBookDetails(bookId: string): void {
    this.fetchBookDetails(bookId);

    // 🧩 Lấy tồn kho chi nhánh
    this.inventoryService.getBranchStockByBook(bookId).subscribe({
      next: (stocks) => {
        this.branchStocks = stocks;
        const totalQty = stocks.reduce((sum, b) => sum + (b.quantity || 0), 0);
        this.selectedBranchStock = { branchName: 'Tất cả', quantity: totalQty };

        // ⚙️ Gán quantity chỉ khi this.books đã có dữ liệu
        if (this.books) {
          this.books.quantity = totalQty;
        } else {
          // Nếu books chưa có, lưu tạm lại và gán sau
          const interval = setInterval(() => {
            if (this.books) {
              this.books.quantity = totalQty;
              clearInterval(interval);
            }
          }, 100);
        }
      },
      error: (err) => console.error('❌ Lỗi tải tồn kho:', err)
    });

    this.bookService.getBookById(bookId).subscribe(book => {
      this.book = { ...book };

      this.relatedBooks = [];

      if (typeof this.book.author === 'string') {
        this.book.author = { _id: '', name: this.book.author };
      }

      if (this.book.author?._id) {
        this.loadAuthorDetails(this.book.author._id);
      } else {
        this.author = this.book.author as any;
      }

      const slug = catSlug(this.book.categoryName);
      const name = catName(this.book.categoryName);

      this.getReviewsByProductId(bookId);

      this.breadcrumbItems = [
        { label: 'Trang chủ', url: '/' },
        { label: name, url: `/category/${slug}` },
        { label: this.book.title }
      ];
      this.loadRelatedBooks();

    });
  }


  orderFromStore(store: any) {
  if (!this.book) return;

  localStorage.setItem('selectedBranch', JSON.stringify(store));

  // ✅ Thêm sản phẩm hiện tại vào giỏ hàng kèm thông tin chi nhánh
  this.cartService.addToCart({
    ...this.book,
    selectedStore: store, // để biết cửa hàng nào
    quantity: 1
  }).subscribe({
    next: () => {
      this.showStoreDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Đặt hàng thành công',
        detail: `Sách đã được thêm vào giỏ hàng từ chi nhánh ${store.name}`,
        key: 'tr',
        life: 2000
      });

      // ✅ Chuyển hướng sang trang giỏ hàng
      setTimeout(() => {
        window.scrollTo(0, 0);
        this.router.navigate(['/cart']);
      }, 800);
    },
    error: (err) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: err?.error?.message || 'Không thể thêm vào giỏ hàng.',
        key: 'tr'
      });
    }
  });
}


  selectBranch(branchName: string) {
    this.selectedBranch = branchName;

    if (branchName === 'ALL') {
      const total = this.branchStocks.reduce((sum, b) => sum + (b.quantity || 0), 0);
      this.selectedBranchStock = { branchName: 'Tất cả', quantity: total };
    } else {
      const found = this.branchStocks.find(b => b.branchName === branchName);
      this.selectedBranchStock = found || { branchName, quantity: 0 };
    }

    // Cập nhật trạng thái nút mua
    this.books!.quantity = this.selectedBranchStock.quantity;
  }

  toggleSummary() {
    if (this.showSummary) {
      // Thu gọn
      this.showSummary = false;
      return;
    }

    // Mở rộng
    this.showSummary = true;

    // ✅ Luôn gọi AI tạo mới, không cache, không lấy từ DB
    this.loadingSummary = true;
    this.bookService.generateSummary(this.book._id).subscribe({
      next: (res) => {
        this.summary = res.summary_ai || '';
        this.loadingSummary = false;
      },
      error: () => {
        this.summary = '⚠️ Có lỗi khi tạo tóm tắt, vui lòng thử lại.';
        this.loadingSummary = false;
      }
    });
  }


  formatSummary(summary: string): string {
    if (!summary) return '';

    // Escape HTML nguy hiểm trước (chỉ escape < và >)
    let formatted = summary.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Chuyển **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Các tiêu đề section thành <h4>
    formatted = formatted.replace(/Mở đầu:/gi, "<h4>Mở đầu</h4>");
    formatted = formatted.replace(/Nội dung:/gi, "<h4>Nội dung</h4>");
    formatted = formatted.replace(/Điểm nổi bật:/gi, "<h4>Điểm nổi bật</h4>");
    formatted = formatted.replace(/Vì sao nên đọc:/gi, "<h4>Vì sao nên đọc</h4>");
    formatted = formatted.replace(/Đối tượng độc giả:/gi, "<h4>Đối tượng độc giả</h4>");
    formatted = formatted.replace(/Tác giả:/gi, "<h4>Tác giả</h4>");

    // Bullet points
    formatted = formatted.replace(/^- (.*)$/gm, "<li>$1</li>");
    formatted = formatted.replace(/^• (.*)$/gm, "<li>$1</li>");

    // Gom <li> thành <ul>
    formatted = formatted.replace(/(<li>.*<\/li>\s*)+/g, match => {
      return `<ul>${match}</ul>`;
    });

    // Giữ xuống dòng còn lại
    formatted = formatted.replace(/\n/g, "<br>");

    return formatted;
  }

  // 🖊️ Tải thông tin tác giả
  private loadAuthorDetails(authorId: string): void {

    this.authorService.getAuthorById(authorId).subscribe({
      next: (data: Author) => {
        this.author = data;
      },
      error: (err) => {
      }
    });
  }

  getAuthorsAndProduct(productId: string) {
    this.authorService.getAuthors().subscribe(authors => {
      this.authors = authors;

      this.http.get<any>(`https://book-store-3-svnz.onrender.com/books/${productId}`)
        .subscribe(book => {
          let authorObj = { name: 'Không rõ', _id: '' };

          if (typeof book.author === 'string') {
            const found = authors.find(a => a._id === book.author);
            if (found) {
              authorObj = {
                _id: found._id ?? '',
                name: found.name ?? 'Không rõ'
              };
            } else {
              authorObj = { _id: book.author, name: 'Không rõ' };
            }
          } else if (typeof book.author === 'object' && book.author?.name) {
            authorObj = book.author;
          }

          this.product = {
            ...book,
            author: authorObj
          };
        });
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

  loadRelatedBooks() {
    this.isLoadingRelated = true;
    this.relatedBooks = [];

    if (!this.book?._id) return;
    console.log('🔍 Load related for book:', this.book._id, this.book.title);

    this.bookService.getRelatedBooksAI(this.book._id).subscribe(res => {
      console.log('✅ Related from API:', res);
      this.relatedBooks = res ?? [];
      this.isLoadingRelated = false;
    });
  }

  fetchBookDetails(id: string): void {
    this.bookService.getBookById(id).subscribe((data) => {
      this.books = data;

      // ✅ Lấy danh sách tồn kho cửa hàng (nếu có)
      if (data.storeStocks && data.storeStocks.length > 0) {
        this.storeStocks = data.storeStocks;
      } else {
        // Nếu không có sẵn, gọi lại từ InventoryService
        this.inventoryService.getStoreStockByBook(id).subscribe({
          next: (stocks) => {
            this.storeStocks = stocks;
            console.log('🏪 Store stocks:', this.storeStocks);
          },
          error: (err) => console.error('❌ Lỗi load store stock:', err)
        });
      }
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
    if (!this.book) return;

    this.cartService.addToCart(this.book).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thêm thành công',
          detail: 'Đã thêm vào giỏ hàng!',
          key: 'tr'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Thêm thất bại',
          detail: err?.error?.message || 'Vui lòng đăng nhập hoặc thử lại.',
          key: 'tr'
        });
      }
    });
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

  openAddressDialog() {
    this.showAddressDialog = true;
    this.filteredAddresses = this.addresses;
  }

  filterAddresses() {
    const keyword = this.addressSearch.toLowerCase();
    this.filteredAddresses = this.addresses.filter(a =>
      a.full.toLowerCase().includes(keyword)
    );
  }

  selectAddress(addr: any) {
    this.selectedAddress = addr;
    this.showAddressDialog = false;

    // Xác định khu vực từ địa chỉ
    const region = this.detectRegion(addr.full);

    // Tính phí và thời gian giao
    this.updateShippingInfo(region);
  }

  saveNewAddress() {
    if (!this.newAddress.full.trim()) return;
    this.addresses.push({ full: this.newAddress.full });
    this.filteredAddresses = this.addresses;
    this.newAddress.full = '';
    this.addingNew = false;
  }

  detectRegion(address: string): 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' {
    const lower = address.toLowerCase();
    if (lower.includes('hồ chí minh') || lower.includes('cần thơ') || lower.includes('nam')) return 'Miền Nam';
    if (lower.includes('hà nội') || lower.includes('bắc')) return 'Miền Bắc';
    return 'Miền Trung';
  }

  updateShippingInfo(region: string) {
    if (region === 'Miền Nam') this.shippingFee = 0;
    else this.shippingFee = 20000;

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 2);

    const weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][deliveryDate.getDay()];
    const dateStr = deliveryDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    this.deliveryTime = `Giao từ 18h - 20h, ngày ${dateStr} (${weekday})`;
  }
}
