import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BooksService } from '../../service/books.service';
import { CommonModule } from '@angular/common';
import { BookDetails } from '../../model/books-details.model';
import { CategoryFormatPipe } from '../../pipes/category-format.pipe';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ProductItemComponent } from '../product-item/product-item.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    ProductItemComponent
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  @Input() product!: BookDetails;
  categoryName: string = '';
  products: BookDetails[] = [];
  breadcrumbItems: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.categoryName = params.get('categoryName') || '';
      this.loadProductsByCategory(this.categoryName);
      this.breadcrumbItems = [
        { label: 'Trang chủ', url: '/' },
        { label: this.formatCategory(this.categoryName) },
      ];
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

  formatCategory(name: string): string {
    // Áp dụng logic tương tự như pipe `categoryFormat`, hoặc inject pipe nếu cần
    switch (name) {
      case 'sach-trong-nuoc': return 'Sách Trong Nước';
      case 'truyen-tranh': return 'Truyện Tranh - Manga';
      case 'sach-tham-khao': return 'Sách Tham Khảo';
      case 'vpp-dung-cu-hoc-sinh': return 'VPP - Dụng cụ học tập';
      case 'do-choi': return 'Đồ chơi';
      case 'lam-dep': return 'Làm đẹp';
      default: return name;
    }
  }
  
}
