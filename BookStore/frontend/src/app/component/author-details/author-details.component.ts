import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthorService } from '../../service/author.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { Author } from '../../model/author.model';
import { AuthService } from '../../service/auth.service';
import { User } from '../../model/users-details.model';
import { BooksService } from '../../service/books.service';
import { BookDetails } from '../../model/books-details.model';
import { MatButtonModule } from '@angular/material/button';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ProductItemComponent } from '../product-item/product-item.component';
import { FavoritePageService } from '../../service/favorite-page.service';
import { CartService } from '../../service/cart.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-author-details',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    CommonModule,
    MatButtonModule,
    RouterModule,
    ButtonModule,
    ToastModule,
    RippleModule
  ],
  templateUrl: './author-details.component.html',
  styleUrls: ['./author-details.component.scss']
})
export class AuthorDetailsComponent implements OnInit {
  @Input() book!: BookDetails;
  books: BookDetails | undefined;
  authorId!: string;
  author: any;
  currentUserId: User | null = null;
  isFavorite = false;
  quantity: number = 1;
  booksByAuthor: BookDetails[] = [];

  constructor(
    private route: ActivatedRoute, 
    private authorService: AuthorService,
    private bookService: BooksService
  ) {}

  ngOnInit() {
  this.authorId = this.route.snapshot.paramMap.get('id')!;
  if (this.authorId) {
    // Lấy thông tin tác giả
    this.authorService.getAuthorById(this.authorId).subscribe((data) => {
      this.author = data;
    });

    // Lấy danh sách sách của tác giả
    this.bookService.getBooks().subscribe((books) => {

      this.booksByAuthor = books.filter(book => book.author === this.author.name);

      console.log("Danh sách sách theo tác giả:", this.booksByAuthor);
    });
  }
}

  loadAuthor(id: string) {
    this.authorService.getAuthorById(id).subscribe({
      next: (data: Author) => {
        this.author = data;
      },
      error: (err) => {
        console.error('Failed to load author', err);
      }
    });
  }

}