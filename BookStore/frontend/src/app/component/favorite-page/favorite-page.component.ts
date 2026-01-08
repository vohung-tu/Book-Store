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
    this.favoriteService.loadWishlist().subscribe();

    this.favoriteService.favorites$.subscribe(books => 
      {
      this.favoriteBooks = books;
    });
  }

  removeFromFavorites(bookId: string) {
    this.favoriteService.removeFromFavorites(bookId).subscribe({
    next: () => {
      // Cập nhật mảng hiện tại
      const updatedList = this.favoriteBooks.filter(b => b._id !== bookId);
      
      // QUAN TRỌNG: Đẩy dữ liệu mới vào Subject để tất cả các nơi đang subscribe đều nhận được bản mới
      // Bạn cần tạo 1 phương thức trong service hoặc truy cập vào subject nếu nó public
      // Cách đơn giản nhất ở đây là cập nhật local và thông báo Service (nếu cần)
      this.favoriteBooks = updatedList;

      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa sách khỏi danh sách yêu thích',
        life: 3000
      });
    },
      error: () => {
        // toast thất bại
        this.messageService.add({
          severity: 'error',
          summary: 'Thất bại',
          detail: 'Không thể xóa sách khỏi danh sách yêu thích',
          life: 3000
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
