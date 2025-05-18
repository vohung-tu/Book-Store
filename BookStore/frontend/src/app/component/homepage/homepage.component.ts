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
    private messageService: MessageService
  ) {}
  intervalId: any;
  books: BookDetails[] = [];
  selectedBook?: BookDetails;
  sachThamKhao: BookDetails[] = [];
  sachTrongNuoc: BookDetails[] = [];
  authors: Author[] = [];
  // Đặt thời gian kết thúc flash sale trong vòng 1 ngày kể từ bây giờ
  flashSaleStart = new Date('2025-04-20T18:00:00');
  flashSaleEnd   = new Date('2025-04-22T18:00:00');
  saleActive = false; // true khi đã sang thời gian sale

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


    });
  }

  getBookDetails(id: string): void {
    this.bookService.getBookById(id).subscribe((data) => {
      this.selectedBook = data;
      console.log('Chi tiết sách:', data);
    });
  }

  startCountdown(): void {
    console.log('Start countdown called');
    this.timerSubscription = interval(1000).subscribe(() => {
      const now = Date.now();

      if (now < this.flashSaleStart.getTime()) {
        // Chưa đến giờ bắt đầu
        this.saleActive = false;
        this.updateTime(this.flashSaleStart.getTime() - now);
      }
      else if (now < this.flashSaleEnd.getTime()) {
        // Đang trong thời gian sale
        this.saleActive = true;
        this.updateTime(this.flashSaleEnd.getTime() - now);
      }
      else {
        // Sale đã kết thúc
        this.setTimeValues(0);
        this.timerSubscription?.unsubscribe();
      }
    });
  }

  private updateTime(distance: number) {
    this.days    = Math.floor(distance / (1000 * 60 * 60 * 24));
    distance %= (1000 * 60 * 60 * 24);

    this.hours   = Math.floor(distance / (1000 * 60 * 60));
    distance %= (1000 * 60 * 60);

    this.minutes = Math.floor(distance / (1000 * 60));
    this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
  }
  
  private setTimeValues(value: number): void {
    this.days = this.hours = this.minutes = this.seconds = value;
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
