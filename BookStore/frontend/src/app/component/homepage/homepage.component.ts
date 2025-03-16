import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RouterModule } from '@angular/router';
import { BookDetails } from '../../model/books-details.model';
import { BooksService } from '../../service/books.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMomentDateModule, 
    RouterModule
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
