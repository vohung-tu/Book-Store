import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
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
    ButtonModule,
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
  bestSellerBooks: BookDetails[] = [];
  responsiveOptions: any[] | undefined;
  trackById = (_: number, c: { _id:string }) => c._id;
  blogPosts = [ { date: '23/03/2025', author: 'Pam Blog', title: 'Yuval Noah Harari: Chúng ta cần giáo dục con trẻ như thế nào để thành công vào năm 2050?', summary: 'Yuval Noah Harari là tác giả người Israel được biết đến nhiều qua các cuốn sách...', }, { date: '21/04/2024', author: 'Pam Blog', title: '6 tựa sách hay về Trung Quốc đương đại khuyến đọc bởi tạp chí SupChina', summary: 'Trung Quốc đã đi một chặng đường dài kể từ những ngày đen tối của cách mạng văn hóa...', }, { date: '15/02/2025', author: 'Pam Blog', title: 'Một số thuật ngữ sách ngoại văn bạn nên biết', summary: '1. Movie tie-in edition là thuật ngữ dùng để chỉ một cuốn sách mà thì...', }, { date: '15/02/2025', author: 'Pam Blog', title: 'Một số thuật ngữ sách ngoại văn bạn nên biết', summary: '1. Movie tie-in edition là thuật ngữ dùng để chỉ một cuốn sách mà thì...', }, ];

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
    private router: Router
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
      { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
      { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
      { breakpoint: '767px', numVisible: 2, numScroll: 1 },
      { breakpoint: '575px', numVisible: 1, numScroll: 1 },
    ];

    // ✅ thêm loading cho best seller
    this.isLoadingBestSeller = true;
    this.bookService.getBestSellers().subscribe((bestSellers) => {
      this.bestSellerBooks = bestSellers;
      this.isLoadingBestSeller = false;
    });
  }


  ngAfterViewInit(): void {
    this.setupLazyObservers();
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

    this.bookService.getBooks().subscribe((res) => {
      const books = res ?? [];
      const reviewRequests = books.map((book) =>
        this.reviewService.getReviews(book._id).toPromise().then((reviews) => {
          book.reviews = reviews;
        })
      );

      Promise.all(reviewRequests).then(() => {
        this.featuredBooks = books.filter((book) => {
          const avg =
            book.reviews?.length
              ? book.reviews.reduce((s, r) => s + r.rating, 0) / book.reviews.length
              : 0;
          return avg >= 4;
        });
        this.isLoadingFeatured = false;
      });
    });
  }

  private loadNewReleaseBooks() {
    if (this.newReleaseBooks.length > 0) return;
    this.isLoadingNewRelease = true;

    this.bookService.getBooks().subscribe((res) => {
      const today = new Date();
      const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      this.newReleaseBooks = (res ?? []).filter((b) => {
        const publishedDate = this.parseDateSafe(b.publishedDate);
        return publishedDate && publishedDate >= ninetyDaysAgo && publishedDate <= today;
      });
      this.isLoadingNewRelease = false;
    });
  }

  private parseDateSafe(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) return value; // Date object trả về trực tiếp

    if (typeof value === 'string') {
      // ISO string hoặc "YYYY-MM-DD"
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return new Date(value);
      }
      // Nếu là "DD/MM/YYYY"
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/');
        return new Date(`${year}-${month}-${day}T00:00:00`);
      }
    }

    return null;
  }

  private loadIncomingReleaseBooks() {
    if (this.incommingReleaseBooks.length > 0) return;
    this.isLoadingIncoming = true;

    this.bookService.getBooks().subscribe((res) => {
      const today = new Date();
      const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

      this.incommingReleaseBooks = (res ?? []).filter((b) => {
        const publishedDate = this.parseDateSafe(b.publishedDate);
        return publishedDate && publishedDate > today && publishedDate <= next90Days;
      });

      this.isLoadingIncoming = false;
    });
  }

  private loadReferenceBooks() {
    if (this.sachThamKhao.length > 0 || this.sachTrongNuoc.length > 0) return;
    this.isLoadingReference = true;

    this.bookService.getBooks().subscribe((res) => {
      const getSlug = (b: BookDetails) =>
        typeof b.categoryName === 'string'
          ? b.categoryName
          : b.categoryName?.slug ?? '';

      const buckets = (res ?? []).reduce(
        (acc, b) => {
          const slug = getSlug(b);
          if (slug === 'sach-tham-khao') acc.tk.push(b);
          if (slug === 'sach-trong-nuoc') acc.tn.push(b);
          return acc;
        },
        { tk: [] as BookDetails[], tn: [] as BookDetails[] }
      );

      this.sachThamKhao = buckets.tk;
      this.sachTrongNuoc = buckets.tn;
      this.isLoadingReference = false;
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
