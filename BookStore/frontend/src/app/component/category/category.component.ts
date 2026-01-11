import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BooksService } from '../../service/books.service';
import { CommonModule } from '@angular/common';
import { BookDetails, Category } from '../../model/books-details.model';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ProductItemComponent } from '../product-item/product-item.component';
import { CategoryService } from '../../service/category.service';
import { combineLatest } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
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
    Toast
  ],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  providers: [MessageService]
})
export class CategoryComponent implements OnInit {
  @Input() product!: BookDetails;
  products: BookDetails[] = [];
  breadcrumbItems: any[] = [];
  categorySlug = '';
  displayName = '';
  noProductsMessage: string = '';
  filteredProducts: BookDetails[] = [];
  categoryName: Category | string = '';
  expanded = { subcategory: true, price: true };
  categoriesTree: Category[] = [];
  expandedIds = new Set<string>();
  authors: string[] = [];
  activeCategorySlug: string = '';
  selectedPrice = '';
  selectedAuthor = '';
  subCategories: Category[] = [];

  constructor(
    private route: ActivatedRoute,
    private bookService: BooksService,
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.categoryService.loadOnce().subscribe(() => {
      this.route.paramMap.subscribe(params => {
        this.categorySlug = params.get('categoryName') || '';
        this.activeCategorySlug = this.categorySlug;

        // load sản phẩm theo category hiện tại
        this.loadProductsByCategory(this.categorySlug);

        // gọi API lấy cây categories
        this.categoryService.getTree().subscribe(tree => {
          const path = this.findNodeWithAncestors(tree, this.categorySlug);

          if (path && path.length > 0) {
            // breadcrumb = Trang chủ + toàn bộ path
            this.breadcrumbItems = [
              { label: 'Trang chủ', url: '/' },
              ...path.map(c => ({
                label: c.name,
                url: `/category/${c.slug}`
              }))
            ];

            // lấy root (cha gốc nhất trong path) để hiển thị sidebar
            this.categoriesTree = [path[0]];

            // tên hiển thị là category cuối cùng trong path
            this.displayName = path[path.length - 1].name;
          }
        });
      });
    });
  }

  /** Tìm node theo slug và trả về path cha → con → cháu */
  findNodeWithAncestors(
    nodes: Category[],
    slug: string,
    path: Category[] = []
  ): Category[] | null {
    for (const node of nodes) {
      const newPath = [...path, node];
      if (node.slug === slug) return newPath;

      if (node.children?.length) {
        const found = this.findNodeWithAncestors(node.children, slug, newPath);
        if (found) return found;
      }
    }
    return null;
  }

  handleToast(event: { severity: string; summary: string; detail: string }) {
    this.messageService.add({
      severity: event.severity || 'success',
      summary: event.summary || 'Thành công',
      detail: event.detail || 'Thao tác đã hoàn tất',
      key: 'tr',
    });
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
              .map(p =>
                p.author && typeof p.author === 'object'
                  ? p.author.name
                  : p.author ?? ''
              )
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
    this.activeCategorySlug = slug;
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

  toggleExpand(id: string) {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      const price = product.flashsale_price || product.price;
      const matchesPrice =
        !this.selectedPrice ||
        (this.selectedPrice === 'low' && price < 100000) ||
        (this.selectedPrice === 'medium' && price >= 100000 && price <= 300000) ||
        (this.selectedPrice === 'high' && price > 300000);

      const authorName =
        product.author !== null && typeof product.author === 'object'
          ? product.author.name
          : typeof product.author === 'string'
            ? product.author
            : '';
      const matchesAuthor = !this.selectedAuthor || authorName === this.selectedAuthor;

      return matchesPrice && matchesAuthor;
    });

    // ✅ Nếu không có sản phẩm phù hợp
    if (!this.filteredProducts.length) {
      if (this.selectedPrice || this.selectedAuthor) {
        this.noProductsMessage = 'Không có sản phẩm phù hợp với bộ lọc của bạn.';
      } else {
        this.noProductsMessage = 'Không có sản phẩm nào trong danh mục này.';
      }
    } else {
      this.noProductsMessage = '';
    }
  }

  isExpanded(cat: Category): boolean {
    if (cat.slug === this.activeCategorySlug) return true;
    if (!cat.children?.length) return false;
    return cat.children.some(child => this.isExpanded(child));
  }
}
