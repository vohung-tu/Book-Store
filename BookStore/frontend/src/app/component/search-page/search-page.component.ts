import { Component, OnInit } from '@angular/core';
import { BookDetails } from '../../model/books-details.model';
import { BooksService } from '../../service/books.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductItemComponent } from '../product-item/product-item.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ProductItemComponent,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent implements OnInit{
  keyword: string = '';
  products: BookDetails[] = [];
  filteredProducts: BookDetails[] = [];
  isLoading = false;
  loadTime = 0;
  private startTime = 0;

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
    private bookService: BooksService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.keyword = params['keyword'] || '';

      this.isLoading = true;
      this.startTime = performance.now();

      this.bookService.getBooks().subscribe({
        next: (res) => {
          this.products = res;
          this.applyFilter();
        },
        error: () => {
          this.isLoading = false;
        },
        complete: () => {
          this.loadTime = Math.round(performance.now() - this.startTime);
          this.isLoading = false;
        }
      });
    });
  }

  applyFilter() {
    const normalizedKeyword = this.normalize(this.keyword);
    this.filteredProducts = this.products.filter(product =>
      this.normalize(product.title).includes(normalizedKeyword)
    );
  }

  handleToast(event: any) {
    this.messageService.add({
      severity: event.severity || 'success',
      summary: event.summary || 'Thành công',
      detail: event.detail || 'Đã thêm sản phẩm vào giỏ hàng',
      life: 3000
    });
  }
}
