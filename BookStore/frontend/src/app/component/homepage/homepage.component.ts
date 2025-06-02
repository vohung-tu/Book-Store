import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, OnDestroy, OnInit, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import { interval, Subscription, takeWhile } from 'rxjs';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RouterModule } from '@angular/router';
import { BookDetails } from '../../model/books-details.model';
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
    private reviewService: ReviewService
  ) {}
  intervalId: any;
  books: BookDetails[] = [];
  selectedBook?: BookDetails;
  sachThamKhao: BookDetails[] = [];
  sachTrongNuoc: BookDetails[] = [];
  authors: Author[] = [];

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
  
  private timerSubscription?: Subscription;

  ngOnInit(): void {
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

    this.bookService.getBooks().subscribe((data) => {
      this.books = data;
      this.sachThamKhao = this.books.filter(book => book.categoryName === 'sach-tham-khao');
      this.sachTrongNuoc = this.books.filter(book => book.categoryName === 'sach-trong-nuoc');

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 60); 

      this.newReleaseBooks = this.books.filter(book => {
        const publishedDate = new Date(book.publishedDate);
        return publishedDate >= thirtyDaysAgo && publishedDate <= today;
      });
      const daysLater = new Date();
      daysLater.setDate(today.getDate() + 70);

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
  

}
