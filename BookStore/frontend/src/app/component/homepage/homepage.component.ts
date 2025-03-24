import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RouterModule } from '@angular/router';
import { BookDetails } from '../../model/books-details.model';
import { BooksService } from '../../service/books.service';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';

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
    TabsModule
  ],
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent implements OnInit, OnDestroy {
  constructor(
    private bookService: BooksService
  ) {}
  books: BookDetails[] = [];
  selectedBook?: BookDetails;
  // Đặt thời gian kết thúc flash sale (ví dụ: 30 00:00:00)
  flashSaleEnd: Date = new Date('2025-03-10T00:00:00');

  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

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
  
  
  private timerSubscription!: Subscription;

  ngOnInit(): void {
    // Cập nhật đếm ngược mỗi giây
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });
    this.updateCountdown();

    this.bookService.getBooks().subscribe((data) => {
      this.books = data;
    });
  }

  getBookDetails(id: string): void {
    this.bookService.getBookById(id).subscribe((data) => {
      this.selectedBook = data;
      console.log('Chi tiết sách:', data);
    });
  }

  updateCountdown(): void {
    const now = new Date().getTime();
    const distance = this.flashSaleEnd.getTime() - now;
  
    if (distance < 0) {
      this.days = 0;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
    } else {
      this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
    }
  }
  
  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

}
