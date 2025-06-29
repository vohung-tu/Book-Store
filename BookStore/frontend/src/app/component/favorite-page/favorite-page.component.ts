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

@Component({
  selector: 'app-favorite-page',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    RippleModule,
    RouterModule
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
    // favorites$: emit (phát ra ) dsach yêu thích mỗi khi có thay đổi
    this.favoriteService.favorites$.subscribe(books => {
      this.favoriteBooks = books;
    });
  }

  removeFromFavorites(bookId: string) {
    this.favoriteService.removeFromFavorites(bookId);
  }

  addToCart(book: BookDetails): void { 
    this.cartService.addToCart({ ...book, quantity: this.quantity});
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Thêm thành công', 
      detail: 'Đã thêm vào giỏ hàng thành công!', 
      key: 'tr', 
      life: 3000 
    });
  }
  
}
