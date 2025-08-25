import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BooksService } from '../../service/books.service';
import { CommonModule } from '@angular/common';
import { BookDetails, Category } from '../../model/books-details.model';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ProductItemComponent } from '../product-item/product-item.component';
import { CategoryService } from '../../service/category.service';
import { combineLatest } from 'rxjs';
// import { MegaMenuItem, MenuItem } from 'primeng/api';
// import { MegaMenu } from 'primeng/megamenu'; 

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    ProductItemComponent,
    // MegaMenu
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  @Input() product!: BookDetails;
  products: BookDetails[] = [];
  breadcrumbItems: any[] = [];
  categorySlug = '';
  displayName = '';
  filteredProducts: BookDetails[] = [];
  categoryName: Category | string = '';
  expanded = { subcategory: true, price: true };
  categoriesTree: Category[] = [];
  authors: string[] = [];
  selectedPrice = '';
  selectedAuthor = '';
  subCategories: Category[] = [];

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.categoryService.loadOnce().subscribe(() => {
      this.route.paramMap.subscribe(params => {
        this.categorySlug = params.get('categoryName') || '';

        // tên có dấu
        this.displayName  = this.categoryService.nameOf(this.categorySlug);

        this.loadProductsByCategory(this.categorySlug);

        // breadcrumb
        this.breadcrumbItems = [
          { label: 'Trang chủ', url: '/' },
          { label: this.displayName, url: `/category/${this.categorySlug}` }
        ];

        // lấy category hiện tại -> tìm sub categories
        const cats = this.categoryService.currentList();
        const current = cats.find(c => c.slug === this.categorySlug);
        if (current?._id) {
          this.loadSubCategories(current._id);
        }
      });
    });

    this.categoryService.getTree().subscribe(tree => this.categoriesTree = tree);
  }

  loadProductsByCategory(slug: string) {
    if (!slug) return;
    this.bookService.getProductsByCategory(slug).subscribe({
      next: (data) => {
        this.products = data ?? [];
        this.filteredProducts = [...this.products];

        // lấy danh sách tác giả duy nhất từ products
        this.authors = Array.from(
          new Set(
            this.products
              .map(p => typeof p.author === 'object' ? p.author.name : p.author)
              .filter(a => !!a)
          )
        );
      },
      error: (e) => console.error(e)
    });
  }

  loadSubCategories(parentId: string) {
    this.categoryService.getChildren(parentId).subscribe({
      next: (children) => this.subCategories = children,
      error: (err) => console.error('❌ Lỗi load sub categories:', err)
    });
  }

  navigateToCategory(slug: string) {
    // khi click filter -> chuyển route
    window.location.href = `/category/${slug}`;
  }

  getCategoryDisplayName(): string {
    return this.categoryService.nameOf(this.categoryName);
  }

  toggleFilter(section: 'subcategory' | 'price') {
    this.expanded[section] = !this.expanded[section];
  }

  onPriceFilter(price: string) {
    this.selectedPrice = price;
    this.applyFilters();
  }

  onAuthorFilter(author: string) {
    this.selectedAuthor = author;
    this.applyFilters();
  }


  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      const price = product.flashsale_price || product.price;
      const matchesPrice =
        !this.selectedPrice ||
        (this.selectedPrice === 'low' && price < 100000) ||
        (this.selectedPrice === 'medium' && price >= 100000 && price <= 300000) ||
        (this.selectedPrice === 'high' && price > 300000);

      const authorName = typeof product.author === 'object' ? product.author.name : product.author;
      const matchesAuthor = !this.selectedAuthor || authorName === this.selectedAuthor;

      return matchesPrice && matchesAuthor;
    });
  }

}
