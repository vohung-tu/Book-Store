import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, catchError, filter, map, of, retry, Subscription, switchMap, take, timeout, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { BookDetails, Category } from '../../model/books-details.model';
import { Author } from '../../model/author.model';
import { BooksService } from '../../service/books.service';
import { AuthorService } from '../../service/author.service';
import { ReviewService } from '../../service/review.service';
import { CategoryService } from '../../service/category.service';
import { ProductItemComponent } from '../product-item/product-item.component';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TabsModule,
    CarouselModule,
    ProductItemComponent,
    ToastModule,
    DividerModule,
    ButtonModule
  ],
  providers: [MessageService],
})
export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {
  books: BookDetails[] = [];
  sachThamKhao: BookDetails[] = [];
  sachTrongNuoc: BookDetails[] = [];
  authors: Author[] = [];
  categories: Category[] = [];
  featuredBooks: BookDetails[] = [];
  newReleaseBooks: BookDetails[] = [];
  incommingReleaseBooks: BookDetails[] = [];
  isLoadingBestSeller = false;
  isLoadingFeatured = false;
  isLoadingNewRelease = false;
  isLoadingIncoming = false;
  isLoadingReference = false;
  isLoadingRecommended = true;
  isLoadingHalloween = false;
  bestSellerBooks: BookDetails[] = [];
  responsiveOptions: any[] | undefined;
  trackById = (_: number, c: { _id:string }) => c._id;
  recommendedBooks: BookDetails[] = [];
  halloweenBooks: BookDetails[] = [];
  alsSuggestions: BookDetails[] = [];
  isLoadingAls = false;
  recentViewedIds: string[] = [];
  recentViewedBooks: BookDetails[] = [];
  isLoadingRecentViews = true;
  referenceCarouselKey = 0;
  visible = {
    featured: false,
    newRelease: false,
    halloween: false,
    incoming: false,
    recommend: false
  };

  private observer?: IntersectionObserver;
  private timerSubscription?: Subscription;
  @ViewChild('featuredTrigger', { static: false }) featuredTrigger!: ElementRef;
  @ViewChild('newReleaseTrigger', { static: false }) newReleaseTrigger!: ElementRef;
  // @ViewChild('halloweenTrigger', { static: false }) halloweenTrigger!: ElementRef;
  @ViewChild('incomingTrigger', { static: false }) incomingTrigger!: ElementRef;
  @ViewChild('recommendTrigger', { static: false }) recommendTrigger!: ElementRef;

  constructor(
    private bookService: BooksService,
    private authorService: AuthorService,
    private messageService: MessageService,
    private reviewService: ReviewService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /** Map ảnh category */
  readonly imageMap: Record<string, string> = {
    'sach-trong-nuoc': 'assets/images/cate-sach-trong-nuoc.png',
    'vpp-dung-cu-hoc-sinh': 'assets/images/cate-dung-cu.jpg',
    'do-choi': 'assets/images/luuniem.webp',
    'lam-dep': 'assets/images/trang-diem.jpg',
    'manga': 'assets/images/truyen-tranh-1.jpg',
    'sach-tham-khao': 'assets/images/sach-tham-khao.jpg',
    'sach-ngoai-van': 'assets/images/sach-nuoc-ngoai.jpg',
    'ma-giam-gia': 'assets/images/coupon-1.jpg',
    'sach-giao-khoa-2025': 'assets/images/sach-giao-khoa.jpg',
  };

  imageFor(slug: string): string {
    return this.imageMap[slug] ?? `assets/images/${slug}.jpg`;
  }

  ngOnInit(): void {
    this.setFavicon('assets/images/logo.png');
    this.initSnow();

    this.categoryService.getCategories().subscribe({
      next: cats => (this.categories = cats.filter(c => !c.parentId))
    });

    this.authorService.getAuthors().subscribe(data => (this.authors = data));

    this.responsiveOptions = [
      { breakpoint: '1600px', numVisible: 5, numScroll: 5 },
      { breakpoint: '1199px', numVisible: 4, numScroll: 4 },
      { breakpoint: '991px', numVisible: 3, numScroll: 3 },
      { breakpoint: '767px', numVisible: 2, numScroll: 2 },
      { breakpoint: '575px', numVisible: 1, numScroll: 1 }
    ];

    this.loadBestSellers();  
    this.loadFeaturedBooks();      
    this.loadNewReleaseBooks();   

    this.loadIncomingReleaseBooks(); 
    // this.loadRecommendedBooks(); 

    // this.loadRecentViews();

    setTimeout(() => {
      this.loadAlsSuggestions();
    }, 1200);
  }

  loadRecentViews() {
    const raw = localStorage.getItem('user');
    if (!raw) return;

    const user = JSON.parse(raw);
    if (!user?._id) return;

    this.isLoadingRecentViews = true;

    this.bookService.getRecentViewed(user._id).subscribe({
      next: books => {
        this.recentViewedBooks = books ?? [];
        this.isLoadingRecentViews = false;
      },
      error: () => {
        this.isLoadingRecentViews = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupVisibilityObserver();
  }

  /** IntersectionObserver cho các section */
  private setupVisibilityObserver() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          if (entry.target === this.featuredTrigger.nativeElement) {
            this.visible.featured = true;
          }
          if (entry.target === this.newReleaseTrigger.nativeElement) {
            this.visible.newRelease = true;
          }
          // if (entry.target === this.halloweenTrigger.nativeElement) {
          //   this.visible.halloween = true;
          // }
          if (entry.target === this.incomingTrigger.nativeElement) {
            this.visible.incoming = true;
          }
          if (entry.target === this.recommendTrigger.nativeElement) {
            this.visible.recommend = true;
          }

          observer.unobserve(entry.target);
          this.cdr.detectChanges();
        });
      },
      { rootMargin: '200px' }
    );

    [
      this.featuredTrigger,
      this.newReleaseTrigger,
      // this.halloweenTrigger,
      this.incomingTrigger,
      this.recommendTrigger
    ].forEach(t => observer.observe(t.nativeElement));
  }

  private loadBestSellers() {
    this.isLoadingBestSeller = true;
    this.bookService.getBestSellers().subscribe({
      next: best => {
        this.bestSellerBooks = (best ?? []).sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
        this.isLoadingBestSeller = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoadingBestSeller = false
    });
  }

  /** Lazy load từng phần */
  private loadFeaturedBooks() {
    if (this.featuredBooks.length > 0 || this.isLoadingFeatured) return;
    this.isLoadingFeatured = true;

    this.bookService.getFeaturedBooks().pipe(
      switchMap(books => {
        if (!books?.length) return of([]);
        const ids = books.map(b => b._id);
        return this.reviewService.getReviewsBulk(ids).pipe(
          map(reviewsMap => books.map(book => ({
            ...book,
            reviews: reviewsMap[book._id] ?? []
          })))
        );
      })
    ).subscribe({
      next: (booksWithReviews) => {
        this.featuredBooks = booksWithReviews.filter(book => {
          const avg = book.reviews.length > 0
            ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
            : 0;
          return avg >= 4;
        });
        this.isLoadingFeatured = false;
        this.cdr.detectChanges();
      },
      error: () => this.isLoadingFeatured = false
    });
  }

  // sản phẩm bạn đã quan tâm
  async loadAlsSuggestions() {
    this.isLoadingAls = true;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const lastViewed = localStorage.getItem("lastViewedBookId");

    // CHIẾN THUẬT: Quyết định nguồn dữ liệu ngay lập tức
    if (user?._id) {
      // Ưu tiên 1: Theo User
      this.bookService.getUserRecommend(user._id).subscribe({
        next: res => this.finishAls(res),
        error: () => this.finishAls([])
      });
    } else if (lastViewed) {
      // Ưu tiên 2: Theo sản phẩm xem gần nhất
      this.bookService.getRelatedAls(lastViewed).subscribe({
        next: res => this.finishAls(res),
        error: () => this.finishAls([])
      });
    } else {
      // Ưu tiên 3: Nếu là khách mới, lấy ngay gợi ý chung (không đợi BestSellers load xong)
      // Giả sử bạn truyền null hoặc 1 ID mặc định để lấy gợi ý chung
      this.bookService.getRelatedAls('').subscribe({
        next: res => this.finishAls(res),
        error: () => this.finishAls([])
      });
    }
  }

  private finishAls(res: any) {
    this.alsSuggestions = res ?? [];
    this.isLoadingAls = false;
    this.cdr.detectChanges(); // Ép UI cập nhật ngay khi có dữ liệu
  }

  // loadRecommendedBooks() {
  //   this.bookService.getRecommendedBooks().subscribe({
  //     next: (books) => {
  //       this.recommendedBooks = books;
  //       console.log('📚 Sách gợi ý:', this.recommendedBooks);
  //       this.isLoadingRecommended = false;
  //     },
  //     error: (err) => {
  //       console.error('❌ Lỗi tải sách gợi ý:', err);
  //     },
  //   });
  // }

  viewBook(book: BookDetails) {
    this.router.navigate(['/book', book._id]);
  }

  // loadHalloweenSection(): void {
  //   // Tránh gọi lại nếu đang load hoặc đã có dữ liệu
  //   if (this.halloweenBooks.length > 0 || this.isLoadingHalloween) return;

  //   this.isLoadingHalloween = true;
  //   this.cdr.detectChanges(); // Hiện Skeleton ngay lập tức

  //   this.bookService.getHalloweenBooks().pipe(
  //     take(1), // Tự động unsubscribe để tối ưu bộ nhớ
  //     catchError((err) => {
  //       console.error('❌ Lỗi tải sách Halloween:', err);
  //       return of([]); // Trả về mảng rỗng nếu lỗi để tắt loading
  //     })
  //   ).subscribe((books) => {
  //     this.halloweenBooks = books || [];
  //     this.isLoadingHalloween = false;
      
  //     // Ép Angular cập nhật View ngay giây phút này
  //     this.cdr.detectChanges(); 
      
  //     // Mẹo: Nếu bạn muốn nó "mượt" hơn, có thể dùng setTimeout 0
  //     // để đẩy việc render vào vòng lặp sự kiện tiếp theo
  //   });
  // }

  private loadNewReleaseBooks() {
    if (this.newReleaseBooks.length > 0) return;
    this.isLoadingNewRelease = true;

    this.bookService.getNewReleases().subscribe((books) => {
      this.newReleaseBooks = books ?? [];
      this.isLoadingNewRelease = false;
      this.cdr.markForCheck();
    });
  }

  private loadIncomingReleaseBooks() {
    if (this.incommingReleaseBooks.length > 0 || this.isLoadingIncoming) return;
    this.isLoadingIncoming = true;

    this.bookService.getIncomingReleases().pipe(
      timeout(4000), // Tăng lên 8 giây cho an toàn
      retry(2),      // Thử lại 2 lần trước khi bỏ cuộc
      catchError((err) => {
        console.error('Lỗi load sách sắp ra mắt:', err);
        return of([] as BookDetails[]);
      })
    ).subscribe((books) => {
      this.incommingReleaseBooks = books || [];
      this.isLoadingIncoming = false;
      
      // Sử dụng detectChanges thay vì markForCheck để ép UI cập nhật ngay lập tức
      this.cdr.detectChanges(); 
    });
  }

  // private referenceLoaded = false;

  // private loadReferenceBooks(): void {
  //   if (this.referenceLoaded) return;

  //   this.referenceLoaded = true;
  //   this.isLoadingReference = true;

  //   this.bookService.getReferenceBooks()
  //     .pipe(
  //       timeout(5000),
  //       catchError(() => of({ sachThamKhao: [], sachTrongNuoc: [] }))
  //     )
  //     .subscribe(res => {
  //       this.sachThamKhao = res.sachThamKhao ?? [];
  //       this.sachTrongNuoc = res.sachTrongNuoc ?? [];
  //       this.isLoadingReference = false;
  //     });
  // }
  setFavicon(iconUrl: string) {
    const link: HTMLLinkElement | null = document.querySelector(
      "link[rel*='icon']"
    );
    if (link) link.href = iconUrl;
    else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = iconUrl;
      document.head.appendChild(newLink);
    }
  }

  navigateToCategory(category: string) {
    if (category) this.router.navigate(['/category', category]);
  }

  handleToast(event: any) {
    this.messageService.add({ ...event, key: 'tr', life: 3000 });
  }

  // tạo hiệu ứng tuyết rơi
  initSnow() {
    const canvas = document.getElementById('snow-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const numFlakes = 120; // số hạt tuyết
    const flakes = [] as any;

    // tạo giọt tuyết
    for (let i = 0; i < numFlakes; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1,    // kích thước
        d: Math.random() + 1,        // độ rơi
        s: Math.random() * 0.5 + 0.3 // lung linh
      });
    }

    // hiệu ứng gió
    let windAngle = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx.shadowBlur = 8;

      for (let flake of flakes) {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();
      }

      update();
    }

    function update() {
      windAngle += 0.002; // tốc độ gió

      for (let flake of flakes) {
        // hiệu ứng lung linh
        flake.x += Math.sin(windAngle) * 0.5;
        flake.y += flake.d;

        // cho tuyết bay lượn theo gió
        flake.x += Math.sin(windAngle * flake.s) * 1.5;

        // nếu tuyết rơi hết thì reset
        if (flake.y > height) {
          flake.x = Math.random() * width;
          flake.y = -10;
        }

        // lệch trái phải vượt màn hình → xuất hiện lại
        if (flake.x > width) flake.x = 0;
        if (flake.x < 0) flake.x = width;
      }
    }

    function animate() {
      draw();
      requestAnimationFrame(animate);
    }

    animate();

    // Cập nhật canvas khi resize
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.timerSubscription?.unsubscribe();
  }
}
