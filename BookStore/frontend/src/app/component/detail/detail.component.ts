import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
    RippleModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  providers: [MessageService]
})

export class DetailComponent implements OnInit{
  @Input() book!: BookDetails;
  isFavorite = false; // Trạng thái yêu thích
  books: BookDetails | undefined;
  quantity: number = 1;
  showDialog = false;
  @ViewChild('cartDialog') cartDialog!: TemplateRef<any>; // Trỏ đến dialog template trong HTML

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private cartService: CartService,
    private favoriteService: FavoritePageService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Lắng nghe sự thay đổi của tham số 'id' trong URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchBookDetails(id);
        this.bookService.getBookById(id).subscribe(book => {
          this.book = book;
        });
      }
    });
  }

  fetchBookDetails(id: string): void {
    this.bookService.getBookById(id).subscribe((data) => {
      this.books = data;
    });
  }

  // Hàm tăng số lượng
  increaseQty(): void {
    this.quantity++;
  }

  // Hàm giảm số lượng (không giảm dưới 1)
  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
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
}
