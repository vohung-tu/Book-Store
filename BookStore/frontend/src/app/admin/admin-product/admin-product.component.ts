import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
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
    Editor
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

  categories: { label: string; value: string }[] = [];

  newProduct = {
    title: '',
    author: {},
    authorId: '',
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
  selectedAuthor = this.authors.find(author => author._id === this.productForm.authorId);

  constructor(
    private http: HttpClient, 
    private authorService: AuthorService, 
    private messageService: MessageService,
    private categoryService: CategoryService) {}

  ngOnInit(): void {
    
    this.filteredProducts = this.products;
    this.authorService.getAuthors().subscribe(data => {
      this.authors = data;
      this.fetchProducts();
    });
     // load categories từ API
    this.categoryService.getCategories().subscribe((cats: Category[]) => {
      this.categories = cats.map(c => ({
        label: c.name,  // tên hiển thị
        value: c.slug   // hoặc c._id nếu muốn lưu theo id
      }));
    });
  }

  getCategoryLabel(value: string): string {
    const hit = this.categories.find(c => c.value === value);
    return hit ? hit.label : value;
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

  fetchProducts() {
    this.http.get<any>('http://localhost:3000/books?limit=1000').subscribe({
      next: data => {
        this.products = (data.items || []).map((book: any) => {
          let authorObj = { name: 'Không rõ', _id: '' };

          if (typeof book.author === 'object' && book.author?.name) {
            authorObj = {
              _id: book.author._id || '',
              name: book.author.name
            };
          } else if (typeof book.author === 'string') {
            const found = this.authors.find(a => a._id === book.author);
            authorObj = found ? { _id: found._id, name: found.name } : { _id: book.author, name: 'Không rõ' };
          }

          return { ...book, id: book._id, author: authorObj };
        });

        this.filteredProducts = [...this.products];
      },
      error: err => console.error('❌ Lỗi khi lấy danh sách sản phẩm:', err)
    });
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

      this.http.put(`http://localhost:3000/books/${this.editingProduct.id}`, this.editingProduct).subscribe({
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

      this.http.post(`http://localhost:3000/books`, this.newProduct).subscribe({
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
      this.http.delete(`http://localhost:3000/books/${product.id}`).subscribe({
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
}
