import { Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BooksService } from '../../service/books.service';
import { BookDetails } from '../../model/books-details.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../service/cart.service';
import { CartDialogComponent } from '../cart/cart-dialog/cart-dialog.component';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule, 
    MatIconModule,
    MatInputModule, 
    RouterModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})

export class DetailComponent implements OnInit{
  @Input() book!: BookDetails;
  books: BookDetails | undefined;
  quantity: number = 1;
  showDialog = false;
  // readonly dialog = inject(MatDialog);
  @ViewChild('cartDialog') cartDialog!: TemplateRef<any>; // Trỏ đến dialog template trong HTML

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private cartService: CartService,
    private dialog: MatDialog
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
    this.cartService.addToCart({ ...this.book, quatity: this.quantity });

    // Mở dialog từ template trong HTML
    this.dialog.open(CartDialogComponent, {
      width: '500px',
      height: '200px',
      data: { message: 'Sản phẩm đã được thêm vào giỏ hàng!' }
    });

    // Tự động đóng sau 2 giây
    setTimeout(() => this.dialog.closeAll(),20000);
  }
}
