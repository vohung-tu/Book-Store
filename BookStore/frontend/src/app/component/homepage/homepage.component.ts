import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, OnDestroy, OnInit, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { interval, Subscription, takeWhile } from 'rxjs';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Router, RouterModule } from '@angular/router';
import { BookDetails, Category } from '../../model/books-details.model';
import { BooksService } from '../../service/books.service';
import { CarouselModule } from 'primeng/carousel';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ProductItemComponent } from '../product-item/product-item.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { Author } from '../../model/author.model';
import { AuthorService } from '../../service/author.service';
import { ReviewService } from '../../service/review.service';
import { CategoryService } from '../../service/category.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMomentDateModule, 
    RouterModule,
    TabsModule,
    CarouselModule,
    ProductItemComponent,
    ToastModule,
    DividerModule,
    ButtonModule
  ],
  styleUrls: ['./homepage.component.scss'],
  providers: [MessageService]
})
export class HomepageComponent implements OnInit, OnDestroy {
  constructor(
    private bookService: BooksService,
    private authorService: AuthorService,
    private messageService: MessageService,
    private reviewService: ReviewService,
    private categoryService: CategoryService,
    private router: Router
  ) {}
  intervalId: any;
  books: BookDetails[] = [];
  selectedBook?: BookDetails;
  sachThamKhao: BookDetails[] = [];
  sachTrongNuoc: BookDetails[] = [];
  authors: Author[] = [];
  categories: Category[] = [];
  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;

  blogPosts = [
    {
      date: '23/03/2025',
      author: 'Pam Blog',
      title: 'Yuval Noah Harari: Chúng ta cần giáo dục con trẻ như thế nào để thành công vào năm 2050?',
      summary: 'Yuval Noah Harari là tác giả người Israel được biết đến nhiều qua các cuốn sách...',
    },
    {
      date: '21/04/2024',
      author: 'Pam Blog',
      title: '6 tựa sách hay về Trung Quốc đương đại khuyến đọc bởi tạp chí SupChina',
      summary: 'Trung Quốc đã đi một chặng đường dài kể từ những ngày đen tối của cách mạng văn hóa...',
    },
    {
      date: '15/02/2025',
      author: 'Pam Blog',
      title: 'Một số thuật ngữ sách ngoại văn bạn nên biết',
      summary: '1. Movie tie-in edition là thuật ngữ dùng để chỉ một cuốn sách mà thì...',
    },
    {
      date: '15/02/2025',
      author: 'Pam Blog',
      title: 'Một số thuật ngữ sách ngoại văn bạn nên biết',
      summary: '1. Movie tie-in edition là thuật ngữ dùng để chỉ một cuốn sách mà thì...',
    },
  ];
  responsiveOptions: any[] | undefined;
  featuredBooks: BookDetails[] = [];
  newReleaseBooks: BookDetails[] = [];
  incommingReleaseBooks: BookDetails[] = [];
  bestSellerBooks:  BookDetails[] = [];
  trackById = (_: number, c: { _id:string }) => c._id;
  
  private timerSubscription?: Subscription;

  ngOnInit(): void {
    this.setFavicon('assets/images/logo.png');
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        // ✅ chỉ giữ category cha (không có parentId)
        this.categories = cats.filter(c => !c.parentId);
      },
      error: (err) => console.error('❌ Lỗi load categories:', err)
    });

    this.authorService.getAuthors().subscribe(data => {
      this.authors = data;
    });

    this.responsiveOptions = [
      {
          breakpoint: '1400px',
          numVisible: 2,
          numScroll: 1
      },
      {
          breakpoint: '1199px',
          numVisible: 3,
          numScroll: 1
      },
      {
          breakpoint: '767px',
          numVisible: 2,
          numScroll: 1
      },
      {
          breakpoint: '575px',
          numVisible: 1,
          numScroll: 1
      }
  ]

    this.bookService.getBooks().subscribe(res => {
      this.books = res ?? [];

      const getCatSlug = (b: BookDetails): string => {
        const c = b.categoryName as any;
        return typeof c === 'string' ? c : c?.slug ?? '';
      };
      const buckets = this.books.reduce(
        (acc, b) => {
          const slug = getCatSlug(b);
          if (slug === 'sach-tham-khao')  acc.tk.push(b);
          if (slug === 'sach-trong-nuoc') acc.tn.push(b);
          return acc;
        },
        { tk: [] as BookDetails[], tn: [] as BookDetails[] }
      );

      this.sachThamKhao  = buckets.tk;
      this.sachTrongNuoc = buckets.tn;

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 90); 

      this.newReleaseBooks = this.books.filter(book => {
        const publishedDate = new Date(book.publishedDate);
        return publishedDate >= thirtyDaysAgo && publishedDate <= today;
      });
      const daysLater = new Date();
      daysLater.setDate(today.getDate() + 365);

      this.incommingReleaseBooks = this.books.filter(book => {
        const publishedDate = new Date(book.publishedDate);
        return publishedDate > today && publishedDate <= daysLater;
      });

      const reviewRequests = this.books.map(book =>
        this.reviewService.getReviews(book._id).toPromise().then(reviews => {
          book.reviews = reviews;
        })
      );

      Promise.all(reviewRequests).then(() => {
        // Khi tất cả reviews đã được cập nhật, lọc các sách có rating >= 4
        this.featuredBooks = this.books.filter(book => {
          const averageRating = book.reviews?.length
            ? book.reviews.reduce((sum, review) => sum + review.rating, 0) / book.reviews.length
            : 0;

          return averageRating >= 4;
        });
      });
    });

    this.bookService.getBestSellers().subscribe((bestSellers) => {
      this.bestSellerBooks = bestSellers;
    });
  }

  setFavicon(iconUrl: string) {
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = iconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = iconUrl;
      document.head.appendChild(newLink);
    }
  }

  getBookDetails(id: string): void {
    this.bookService.getBookById(id).subscribe((data) => {
      this.selectedBook = data;
      console.log('Chi tiết sách:', data);
    });
  }
  
  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  handleToast(event: any) {
    this.messageService.add({
      ...event,
      key: 'tr',
      life: 3000
    });
  }
  navigateToCategory(category: string) {
    if (!category) {
      return;
    }
    this.router.navigate(['/category', category]);
  }

   imageFor(slug: string): string {
    const map: Record<string, string> = {
      'sach-trong-nuoc': 'assets/images/cate-sach-trong-nuoc.png',
      'vpp-dung-cu-hoc-sinh': 'assets/images/cate-dung-cu.jpg',
      'do-choi': 'assets/images/luuniem.webp',
      'lam-dep': 'assets/images/trang-diem.jpg',
      'manga': 'assets/images/truyen-tranh-1.jpg',
      'sach-tham-khao': 'assets/images/sach-tham-khao.jpg',
      'sach-ngoai-van': 'assets/images/sach-nuoc-ngoai.jpg',
      'ma-giam-gia': 'assets/images/coupon-1.jpg',
      'sach-giao-khoa-2025': 'assets/images/sach-giao-khoa.jpg'
    };
    return map[slug] ?? `assets/images/${slug}.jpg`; // fallback nếu bạn đặt tên ảnh theo slug
  }

}
