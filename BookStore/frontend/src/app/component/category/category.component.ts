import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BooksService } from '../../service/books.service';
import { CommonModule } from '@angular/common';
import { BookDetails } from '../../model/books-details.model';
import { CategoryFormatPipe } from '../../pipes/category-format.pipe';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CategoryFormatPipe
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  categoryName: string = '';
  products: BookDetails[] = [];

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoryName = params.get('categoryName') || '';
      this.loadProductsByCategory(this.categoryName);
    });
  }

  loadProductsByCategory(category: string): void {
    if (!category) {
      console.warn('⚠️ Không có category nào được truyền vào!');
      return;
    }
  
    this.bookService.getProductsByCategory(category).subscribe(
      data => {
        this.products = data;
      },
      error => console.error('Lỗi khi fetch sản phẩm:', error)
    );
  }
  
}
