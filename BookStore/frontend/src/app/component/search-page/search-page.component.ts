import { Component, OnInit } from '@angular/core';
import { BookDetails } from '../../model/books-details.model';
import { BooksService } from '../../service/books.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductItemComponent } from '../product-item/product-item.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ProductItemComponent
  ],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent implements OnInit{
  keyword: string = '';
  products: BookDetails[] = [];
  filteredProducts: BookDetails[] = [];

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }
  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.keyword = params['keyword'] || '';
  
      if (this.keyword) {
        this.bookService.getBooks().subscribe(res => {
          this.products = res;
          this.applyFilter(); // Gọi hàm lọc tại đây
        });
      }
    });
  }
  applyFilter() {
    const normalizedKeyword = this.normalize(this.keyword);
    this.filteredProducts = this.products.filter(product =>
      this.normalize(product.title).includes(normalizedKeyword)
    );
  }
}
