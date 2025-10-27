import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, Subscription, timeout, timer } from 'rxjs';
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
import { ChatbotComponent } from '../chatbot/chatbot.component';

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
  isLoadingHalloween = true;
  bestSellerBooks: BookDetails[] = [];
  responsiveOptions: any[] | undefined;
  trackById = (_: number, c: { _id:string }) => c._id;
  blogPosts = [ { date: '23/03/2025', author: 'Pam Blog', title: 'Yuval Noah Harari: Chúng ta cần giáo dục con trẻ như thế nào để thành công vào năm 2050?', summary: 'Yuval Noah Harari là tác giả người Israel được biết đến nhiều qua các cuốn sách...', }, { date: '21/04/2024', author: 'Pam Blog', title: '6 tựa sách hay về Trung Quốc đương đại khuyến đọc bởi tạp chí SupChina', summary: 'Trung Quốc đã đi một chặng đường dài kể từ những ngày đen tối của cách mạng văn hóa...', }, { date: '15/02/2025', author: 'Pam Blog', title: 'Một số thuật ngữ sách ngoại văn bạn nên biết', summary: '1. Movie tie-in edition là thuật ngữ dùng để chỉ một cuốn sách mà thì...', }, { date: '15/02/2025', author: 'Pam Blog', title: 'Một số thuật ngữ sách ngoại văn bạn nên biết', summary: '1. Movie tie-in edition là thuật ngữ dùng để chỉ một cuốn sách mà thì...', }, ];
  recommendedBooks: BookDetails[] = [];
  halloweenBooks: BookDetails[] = [];

  private observer?: IntersectionObserver;
  private timerSubscription?: Subscription;

  // 🔑 Các section để lazy load
  @ViewChild('featuredTrigger', { static: false }) featuredTrigger!: ElementRef;
  @ViewChild('newReleaseTrigger', { static: false }) newReleaseTrigger!: ElementRef;
  @ViewChild('incomingTrigger', { static: false }) incomingTrigger!: ElementRef;
  @ViewChild('referenceTrigger', { static: false }) referenceTrigger!: ElementRef;

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

    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats.filter((c) => !c.parentId)),
      error: (err) => console.error('❌ Lỗi load categories:', err),
    });

    this.authorService.getAuthors().subscribe((data) => (this.authors = data));

    this.responsiveOptions = [
      { breakpoint: '1600px', numVisible: 5, numScroll: 5 },
      { breakpoint: '1199px', numVisible: 4, numScroll: 4 },
      { breakpoint: '991px', numVisible: 3, numScroll: 3 },
      { breakpoint: '767px', numVisible: 2, numScroll: 2 },
      { breakpoint: '575px', numVisible: 1, numScroll: 1 }
    ];

    // ✅ thêm loading cho best seller
    this.isLoadingBestSeller = true;
    this.bookService.getBestSellers().subscribe((bestSellers) => {
      this.bestSellerBooks = (bestSellers ?? [])
      .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
      this.isLoadingBestSeller = false;
    });

    this.loadHalloweenSection();
    this.loadRecommendedBooks();
  }

  ngAfterViewInit(): void {
    this.setupLazyObservers();
    this.timerSubscription = timer(2000).subscribe(() => {
      this.loadFeaturedBooks();
      this.loadNewReleaseBooks();
      this.loadIncomingReleaseBooks();
      this.loadReferenceBooks();
      this.cdr.markForCheck();
    });
  }

  /** IntersectionObserver cho các section */
  private setupLazyObservers() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === this.featuredTrigger?.nativeElement) {
              this.loadFeaturedBooks();
              this.observer?.unobserve(entry.target);
            }
            if (entry.target === this.newReleaseTrigger?.nativeElement) {
              this.loadNewReleaseBooks();
              this.observer?.unobserve(entry.target);
            }
            if (entry.target === this.incomingTrigger?.nativeElement) {
              this.loadIncomingReleaseBooks();
              this.observer?.unobserve(entry.target);
            }
            if (entry.target === this.referenceTrigger?.nativeElement) {
              this.loadReferenceBooks();
              this.observer?.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    if (this.featuredTrigger)
      this.observer.observe(this.featuredTrigger.nativeElement);
    if (this.newReleaseTrigger)
      this.observer.observe(this.newReleaseTrigger.nativeElement);
    if (this.incomingTrigger)
      this.observer.observe(this.incomingTrigger.nativeElement);
    if (this.referenceTrigger)
      this.observer.observe(this.referenceTrigger.nativeElement);
  }

  /** Lazy load từng phần */
  private loadFeaturedBooks() {
    if (this.featuredBooks.length > 0) return;
    this.isLoadingFeatured = true;

    this.bookService.getFeaturedBooks().subscribe((books) => {
      const ids = books.map((b) => b._id);
      this.reviewService.getReviewsBulk(ids).subscribe((reviewsMap) => {
        books.forEach((book) => {
          book.reviews = reviewsMap[book._id] ?? [];
        });

        this.featuredBooks = books.filter((book) => {
          const avg = (book.reviews?.length ?? 0) > 0
            ? book.reviews!.reduce((s, r) => s + r.rating, 0) / book.reviews!.length
            : 0;
          return avg >= 4;
        });

        this.isLoadingFeatured = false;
        this.cdr.markForCheck();
      });
    });
  }

  loadRecommendedBooks() {
    this.bookService.getRecommendedBooks().subscribe({
      next: (books) => {
        this.recommendedBooks = books;
        console.log('📚 Sách gợi ý:', this.recommendedBooks);
        this.isLoadingRecommended = false;
      },
      error: (err) => {
        console.error('❌ Lỗi tải sách gợi ý:', err);
      },
    });
  }

  viewBook(book: BookDetails) {
    this.router.navigate(['/book', book._id]);
  }

  loadHalloweenSection(): void {
    this.isLoadingHalloween = true;
    this.bookService.getHalloweenBooks().subscribe({
      next: (books) => {
        this.halloweenBooks = books || [];
        this.isLoadingHalloween = false;
        console.log('🎃 Sách Halloween:', this.halloweenBooks);
      },
      error: (err) => {
        console.error('❌ Lỗi tải sách Halloween:', err);
        this.isLoadingHalloween = false;
      },
    });
  }

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
    if (this.incommingReleaseBooks.length > 0) return;
    this.isLoadingIncoming = true;

    this.bookService.getIncomingReleases().pipe(
      timeout(3000),
      catchError(() => of([] as BookDetails[]))
    ).subscribe((books) => {
      this.incommingReleaseBooks = books ?? [];
      this.isLoadingIncoming = false;
      this.cdr.markForCheck();
    });
  }

  private loadReferenceBooks() {
    if (this.sachThamKhao.length > 0 || this.sachTrongNuoc.length > 0) return;
    this.isLoadingReference = true;

    this.bookService.getReferenceBooks().pipe(
      timeout(3000),
      catchError(() => of({ sachThamKhao: [], sachTrongNuoc: [] }))
    ).subscribe((res) => {
      this.sachThamKhao = res.sachThamKhao;
      this.sachTrongNuoc = res.sachTrongNuoc;
      this.isLoadingReference = false;
      this.cdr.markForCheck();
    });
  }

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

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.timerSubscription?.unsubscribe();
  }
}
