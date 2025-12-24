import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { forkJoin } from 'rxjs';
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
    categoryName: '',
    quantity: 0,
    images: [] as string[],
    coverImage: '',
  };
  selectedAuthor = this.authors.find(author => author._id === this.productForm.authorId);
  displaySidebar: boolean = false;
  selectedProduct: any = null;

  constructor(
    private http: HttpClient, 
    private authorService: AuthorService, 
    private messageService: MessageService,
    private categoryService: CategoryService,
    private inventoryService: InventoryService,
    private bookService: BooksService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.filteredProducts = this.products;

    // 🔁 Chạy song song 3 API: authors, categories, suppliers
    forkJoin({
      authors: this.authorService.getAuthors(),
      categories: this.categoryService.getCategories(),
      suppliers: this.http.get<any[]>('https://book-store-3-svnz.onrender.com/suppliers')
    }).subscribe({
      next: ({ authors, categories, suppliers }) => {
        // ✅ Gán dữ liệu trả về
        this.authors = authors;
        this.suppliers = suppliers;
        this.categories = categories.map((c: Category) => ({
          label: c.name,
          value: c.slug
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
    console.log('Index:', index);
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

    this.bookService.getAllDetailed().subscribe({
      next: (books) => {
        this.products = books.map((book: any) => {

          const authorObj =
            typeof book.author === 'object' && book.author?.name
              ? { _id: book.author._id, name: book.author.name }
              : { _id: book.author, name: 'Không rõ' };

          const supplierObj =
            typeof book.supplierId === 'object' && book.supplierId?.name
              ? { _id: book.supplierId._id, name: book.supplierId.name }
              : this.suppliers.find(s => s._id === book.supplierId) || null;

          return {
            ...book,
            id: book._id,
            author: authorObj,
            supplierId: supplierObj,
            warehouseStocks: book.warehouseStocks || [],
            storeStocks: book.storeStocks || [],
          };
        });

        this.filteredProducts = [...this.products];
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Lỗi khi tải sản phẩm:', err);
        this.loading = false;
      },
    });
  }

  openDetails(product: any) {
    this.selectedProduct = product;
    this.displaySidebar = true;
  }

  openAddProductDialog() {
    this.displayAddDialog = true;
  }

  filterProducts() {
    const query = this.searchText.toLowerCase();
    this.filteredProducts = this.products.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.author.name.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query)
    );
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

  saveProduct() {
    const additionalImages = this.productForm.images || [];
    const selectedAuthor = this.authors.find(author => author._id === this.productForm.authorId);
    const wasEditMode = this.isEditMode; // ⬅️ Lưu trạng thái trước khi reset

    if (this.isEditMode) {
      if (!this.editingProduct?.id) {
        console.error('Không có ID sản phẩm để cập nhật');
        return;
      }

      this.editingProduct.coverImage = this.productForm.coverImage;
      this.editingProduct.images = additionalImages;
      this.editingProduct.author = selectedAuthor || { _id: '', name: 'Không rõ' };
      this.editingProduct.supplierId = this.productForm.supplierId;

      this.http.put(`https://book-store-3-svnz.onrender.com/books/${this.editingProduct.id}`, this.editingProduct).subscribe({
        next: () => {
          this.fetchProducts();
          this.resetDialog();

          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Sản phẩm đã được ${wasEditMode ? 'cập nhật' : 'thêm mới'}.`,
            life: 3000
          });
        },
        error: (err) => console.error('Lỗi khi cập nhật sản phẩm', err)
      });

    } else {
      this.newProduct.coverImage = this.productForm.coverImage;
      this.newProduct.images = additionalImages;
      this.newProduct.author = selectedAuthor || { _id: '', name: 'Không rõ' };
      this.newProduct.supplierId = this.productForm.supplierId;

      this.http.post(`https://book-store-3-svnz.onrender.com/books`, this.newProduct).subscribe({
        next: () => {
          this.fetchProducts();
          this.resetDialog();

          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Sản phẩm  đã được ${wasEditMode ? 'cập nhật' : 'thêm mới'}.`,
            life: 3000
          });
        },
        error: (err) => console.error('Lỗi khi thêm sản phẩm', err)
      });
    }
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
    this.isEditMode = true;
    this.editingProduct = { ...product };
    this.editingProduct.authorId = product.author?._id || '';
    this.newProduct = { ...product };   
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
