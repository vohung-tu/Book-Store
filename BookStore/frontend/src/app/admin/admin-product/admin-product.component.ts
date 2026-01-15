import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';
import { Editor } from 'primeng/editor';
import { AuthorService } from '../../service/author.service';
import { Author } from '../../model/author.model';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CategoryService } from '../../service/category.service';
import { Category } from '../../model/books-details.model';
import { InventoryService } from '../../service/inventory.service';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BooksService } from '../../service/books.service';
import { SidebarModule } from 'primeng/sidebar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-admin-product',
  standalone: true,
  imports: [
    TableModule,
    CommonModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    CheckboxModule,
    TooltipModule,
    DropdownModule,
    DotSeparatorPipe,
    Editor,
    ProgressSpinnerModule,
    SidebarModule
  ],
  providers: [MessageService],
  templateUrl: './admin-product.component.html',
  styleUrls: ['./admin-product.component.scss']
})
export class AdminProductComponent {
  isExpanded = false;
  expandedRows: { [key: number]: boolean } = {};
  products: any[] = [];
  displayAddDialog = false;
  editingProduct: any = null;
  isEditMode = false;
  searchText: string = '';
  
  filteredProducts: any[] = [];
  selectedProducts: any[] = [];
  text: string | undefined;
  imagesInput: string = ''; 
  authors: Author[] = [];
  loading = false;
  suppliers: any[] = [];
  submitted = false;
  supplierMap = new Map<string, any>();
  authorMap = new Map<string, any>();
  totalRecords = 0;

  categories: { label: string; value: string }[] = [];

  newProduct = {
    title: '',
    author: {},
    authorId: '',
    supplierId: '', 
    description: '',
    price: 0,
    flashsale_price: 0,
    discount_percent: 0,
    publishedDate: '',
    category: '',
    categoryName: '',
    quantity: 0,
    images: [] as string[],
    coverImage: '',
  };
  selectedAuthor = this.authors.find(author => author._id === this.productForm.authorId);
  displaySidebar: boolean = false;
  selectedProduct: any = null;
  private search$ = new Subject<string>();

  constructor(
    private http: HttpClient, 
    private authorService: AuthorService, 
    private messageService: MessageService,
    private categoryService: CategoryService,
    private bookService: BooksService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    // 🔁 Chạy song song 3 API: authors, categories, suppliers
    forkJoin({
      authors: this.authorService.getAuthors(),
      categories: this.categoryService.getCategories(),
      suppliers: this.http.get<any[]>('https://book-store-3-svnz.onrender.com/suppliers')
    }).subscribe({
      next: ({ authors, categories, suppliers }) => {
        this.authors = authors;
        this.suppliers = suppliers;

        this.authorMap.clear();
        this.supplierMap.clear();
        
        this.authors.forEach(a => this.authorMap.set(a._id, a));
        this.suppliers.forEach(s => this.supplierMap.set(s._id, s));

        this.categories = categories.map((c: Category) => ({
          label: c.name,
          value: c._id
        }));

        // Sau khi đã có dữ liệu nền → mới fetch sách chi tiết
        this.fetchProducts();
      },
      error: (err) => {
        console.error('❌ Lỗi khi tải dữ liệu nền:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi tải dữ liệu',
          detail: 'Không thể tải danh mục / tác giả / nhà cung cấp.',
        });
      }
    });

    // Lắng nghe sự kiện cập nhật đơn hàng (khi admin đổi trạng thái sang Hoàn thành)
    window.addEventListener('storage', (event) => {
      if (event.key === 'orderUpdated') {
        try {
          const info = JSON.parse(event.newValue || '{}');
          if (info.status === 'completed') {
            console.log('🧾 Đơn hàng hoàn thành → reload tồn kho sản phẩm...');
            this.fetchProducts(); // Gọi lại để cập nhật cột "Tồn kho theo cửa hàng"
            this.messageService.add({
              severity: 'info',
              summary: 'Cập nhật tồn kho',
              detail: 'Đã cập nhật lại dữ liệu tồn kho cửa hàng sau khi hoàn thành đơn hàng.',
              life: 2500
            });
          }
        } catch (e) {
          console.warn('⚠️ Không thể parse orderUpdated event:', e);
        }
      }
    });

    window.addEventListener('order-updated', (e: any) => {
      if (e?.detail?.status === 'completed') {
        this.fetchProducts(); // cập nhật "Tồn kho theo cửa hàng"
      }
    });
  }

  getCategoryLabel(value: string): string {
    const hit = this.categories.find(c => c.value === value);
    return hit ? hit.label : value;
  }

  fetchSuppliers() {
    this.http.get<any[]>('https://book-store-3-svnz.onrender.com/suppliers').subscribe({
      next: data => this.suppliers = data,
      error: err => console.error('❌ Lỗi tải NCC:', err)
    });
  }

  stripHtmlTags(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  formatDescription(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText;
  }
  
  toggleExpand(index: number) {
    this.expandedRows[index] = !this.expandedRows[index];
    console.log(this.expandedRows);
  }

  onAuthorSelect(event: any) {
    const selectedAuthor = this.authors.find(author => author._id === event.value);

    if (selectedAuthor) {
      this.productForm.author = { _id: selectedAuthor._id, name: selectedAuthor.name }; // ✅ Lưu cả `_id` và `name`
    }
  }

  fetchProducts(): void {
    this.loading = true;

    this.bookService.getAdminBooks(1, 40).subscribe({
      next: (res) => {
        const books = res?.items ?? [];

        this.products = books.map((book: any) => {

          // ===== SUPPLIER =====
          let supplierObj = null;
          if (book.supplierId) {
            const supplierId =
              typeof book.supplierId === 'object'
                ? book.supplierId._id
                : book.supplierId;

            supplierObj = this.supplierMap.get(supplierId) || null;
          }

          return {
            ...book,
            id: book._id,          // cho p-table dataKey
            supplierId: supplierObj,
          };
        });

        this.filteredProducts = [...this.products];
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải sản phẩm:', err);
        this.loading = false;
      }
    });
  }

  openDetails(product: any) {
    this.displaySidebar = true;
    this.selectedProduct = null;

    this.bookService.getAdminDetail(product.id).subscribe({
      next: (res) => {
        this.selectedProduct = {
          ...res,
          id: res._id
        };
      },
      error: (err) => {
        console.error('Lỗi khi load chi tiết sách:', err);
      }
    });
  }

  openAddProductDialog() {
    this.submitted = false;
    this.isEditMode = false;
    this.resetProductData();
    this.displayAddDialog = true;
  }

  onSearch() {
    this.loadProductsLazy({
      first: 0,
      rows: 10,
    });
  }

  deleteSelectedProducts() {
    if (this.selectedProducts && this.selectedProducts.length) {
      this.filteredProducts = this.filteredProducts.filter(p => !this.selectedProducts.includes(p));
      const count = this.selectedProducts.length;
      this.selectedProducts = [];

      this.messageService.add({
        severity: 'success',
        summary: 'Đã xoá sản phẩm',
        detail: `${count} sản phẩm đã được xoá khỏi danh sách.`,
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Chưa chọn sản phẩm',
        detail: 'Vui lòng chọn sản phẩm để xoá.',
      });
    }
  }

  // Hàm validate trả về true/false và hiển thị toast lỗi
  validateProduct(): boolean {
    const p = this.productForm;
    if (!p.title?.trim()) return false;
    if (!p.authorId) return false;
    if (p.price === null || p.price === undefined || p.price < 0) return false;
    if (p.flashsale_price > p.price) {
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Giá giảm không được lớn hơn giá gốc' });
      return false;
    }
    if (!p.category) return false; 
    if (!p.supplierId) return false;
    if (!p.coverImage) return false;
    return true;
  }

  // Hàm hỗ trợ hiển thị lỗi nhanh
  showError(detail: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi dữ liệu',
      detail: detail
    });
  }
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (this.isEditMode && this.editingProduct) {
          this.editingProduct.coverImage = reader.result as string;
        } else {
          this.newProduct.coverImage = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }
  onAdditionalImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.productForm.images = []; // clear old previews

      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            this.productForm.images.push(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  calculateFlashSalePrice() {
    const price = this.productForm.price;
    const discount = this.productForm.discount_percent;

    if (
      price != null &&
      price >= 0 &&
      discount != null &&
      discount >= 0 &&
      discount <= 100
    ) {
      this.productForm.flashsale_price =
        Math.round(price * (1 - discount / 100));
    } else {
      this.productForm.flashsale_price = price;
    }
  }


  saveProduct() {
  this.submitted = true;
  if (!this.validateProduct()) return;

  const selectedAuthor = this.authors.find(a => a._id === this.productForm.authorId);
  const selectedCategory = this.categories.find(c => c.value === this.productForm.category);

  const payload = {
    title: this.productForm.title,
    description: this.productForm.description,
    price: this.productForm.price,
    discount_percent: this.productForm.discount_percent,
    flashsale_price: this.productForm.flashsale_price,
    publishedDate: this.productForm.publishedDate,
    quantity: this.productForm.quantity,

    category: selectedCategory?.value, // ObjectId
    categoryName: selectedCategory?.label,

    author: selectedAuthor?._id,
    supplier: this.productForm.supplierId,

    coverImage: this.productForm.coverImage,
    images: this.productForm.images
  };

  console.log('PAYLOAD:', payload);

  const req$ = this.isEditMode
    ? this.http.put(`https://book-store-3-svnz.onrender.com/books/${this.editingProduct.id}`, payload)
    : this.http.post(`https://book-store-3-svnz.onrender.com/books`, payload);

  req$.subscribe({
    next: () => this.handleSuccess(this.isEditMode ? 'Cập nhật thành công' : 'Thêm mới thành công'),
    error: err => {
      console.error(err);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: err.error?.message || 'Không thể lưu sản phẩm'
      });
    }
  });
}



  handleSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Thành công', detail: message });
    this.displayAddDialog = false;
    this.fetchProducts();
    this.submitted = false;
  }

  resetDialog() {
    this.displayAddDialog = false;
    this.isEditMode = false;
    this.editingProduct = null;
    this.newProduct = {
      title: '',
      author: {},
      authorId: '',
      supplierId: '', 
      description: '',
      price: 0,
      flashsale_price: 0,
      discount_percent: 0,
      publishedDate: '',
      category: '',
      categoryName: '',
      quantity: 0,
      images: [] as string[],
      coverImage: ''
    };
  }

  get productForm() {
    return this.isEditMode ? this.editingProduct : this.newProduct;
  }

  get formattedPublishedDate(): string {
    const date = this.productForm.publishedDate;
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onDateChange(value: string) {
    this.productForm.publishedDate = value;
  }

  editProduct(product: any) {
    this.submitted = false;
    this.isEditMode = true;

    const categoryId =
      typeof product.category === 'object'
        ? product.category._id
        : product.category || '';

    this.editingProduct = {
      title: product.title || '',
      description: product.description || '',

      authorId:
        typeof product.author === 'object'
          ? product.author._id
          : product.author || '',

      category: categoryId,

      supplierId:
        typeof product.supplierId === 'object'
          ? product.supplierId._id
          : product.supplierId || '',

      price: product.price || 0,
      flashsale_price: product.flashsale_price || product.price || 0,
      discount_percent: product.discount_percent || 0,

      quantity: product.quantity ?? 0,
      images: product.images || [],
      coverImage: product.coverImage || '',

      publishedDate: product.publishedDate
        ? new Date(product.publishedDate).toISOString().slice(0, 10)
        : '',
    };

    console.log('EDIT FORM:', this.editingProduct);
    this.displayAddDialog = true;
  }

  deleteProduct(product: any) {
    if (confirm(`Bạn có chắc muốn xoá sản phẩm "${product.title}"?`)) {
      this.http.delete(`https://book-store-3-svnz.onrender.com/books/${product.id}`).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Xoá thành công',
            detail: `Sản phẩm "${product.title}" đã được xoá.`,
          });
        },
        error: (err) => {
          console.error('Lỗi khi xoá sản phẩm', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi xoá',
            detail: `Không thể xoá sản phẩm "${product.title}".`,
          });
        }
      });
    }
  }

  loadProductsLazy(event: any) {
    this.loading = true;

    const page = event.first / event.rows + 1;
    const limit = event.rows;

    this.bookService.getAdminBooks(page, limit, this.searchText).subscribe({
      next: (res) => {
        this.products = res.items.map((book: any) => ({
          ...book,
          id: book._id
        }));

        this.totalRecords = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  resetProductData() {
    this.newProduct = {
      title: '',
      author: {},
      authorId: '',
      supplierId: '', 
      description: '',
      price: 0,
      flashsale_price: 0,
      discount_percent: 0,
      publishedDate: '',
      category: '',
      categoryName: '',
      quantity: 0,
      images: [],
      coverImage: '',
    };
  }

  exportProductsToExcel() {
    const data = this.filteredProducts.map((p, index) => ({
      'STT': index + 1,
      'Mã sách': p.id,                       // MongoDB _id
      'Tên sách': p.title,
      'Tác giả': p.author?.name || '',
      'Danh mục': this.getCategoryLabel(p.categoryName),
      'Nhà cung cấp': p.supplierId?.name || '',
      'Giá gốc': p.price,
      'Giá giảm': p.flashsale_price,
      'Giảm (%)': p.discount_percent,
      'Số lượng': p.quantity,
      'Đã bán': p.sold,
      'Ngày phát hành': p.publishedDate
        ? new Date(p.publishedDate).toLocaleDateString('vi-VN')
        : ''
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Sản phẩm': worksheet },
      SheetNames: ['Sản phẩm']
    };

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    this.saveExcelFile(excelBuffer, 'Danh_sach_san_pham');
  }

  saveExcelFile(buffer: any, fileName: string) {
    const data: Blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    saveAs(data, `${fileName}_${new Date().getTime()}.xlsx`);
  }

}
