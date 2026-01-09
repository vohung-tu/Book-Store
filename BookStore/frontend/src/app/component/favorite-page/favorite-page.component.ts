import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { BookDetails } from '../../model/books-details.model';
import { FavoritePageService } from '../../service/favorite-page.service';
import { CartService } from '../../service/cart.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { RouterModule } from '@angular/router';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';

@Component({
  selector: 'app-favorite-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    RippleModule,
    RouterModule,
    DotSeparatorPipe
  ],
  templateUrl: './favorite-page.component.html',
  styleUrls: ['./favorite-page.component.scss'],
  providers: [MessageService]
})
export class FavoritePageComponent implements OnInit{
  @Input() book!: BookDetails;
  quantity: number = 1;
  favoriteBooks: BookDetails[] = [];
  constructor(
    private favoriteService: FavoritePageService,
    private cartService: CartService,
    private messageService: MessageService

  ) {}

  ngOnInit(): void {
    // Load dữ liệu từ server khi component khởi tạo
    this.favoriteService.loadWishlist().subscribe();

    // Lắng nghe thay đổi từ Subject
    this.favoriteService.favorites$.subscribe(books => {
      this.favoriteBooks = books;
    });
  }

  removeFromFavorites(bookId: string | undefined): void {
    if (!bookId) return;

    this.favoriteService.removeFromFavorites(bookId).subscribe({
      next: () => {
        // Không cần filter thủ công ở đây nữa vì Service đã làm qua Subject
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã xóa khỏi danh sách yêu thích'
        });
      },
      error: (err) => {
        console.error('Lỗi xóa:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa sản phẩm'
        });
      }
    });
  }

  addToCart(book: BookDetails): void { 
    this.cartService.addToCart(book).subscribe(() => {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Thêm thành công', 
        detail: 'Đã thêm vào giỏ hàng thành công!', 
        key: 'tr', 
        life: 3000 
      });
    });
  }
  
}
