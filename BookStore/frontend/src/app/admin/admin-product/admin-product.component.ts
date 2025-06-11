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

  categories = [
    { label: 'Sách Trong Nước', value: 'sach-trong-nuoc' },
    { label: 'Truyện tranh - Manga', value: 'manga' },
    { label: 'VPP - Dụng cụ học tập', value: 'vpp-dung-cu-hoc-sinh' },
    { label: 'Đồ chơi', value: 'do-choi' },
    { label: 'Làm đẹp', value: 'lam-dep' },
    { label: 'Sách tham khảo', value: 'sach-tham-khao' },
    { label: 'Sách ngoại văn', value: 'sach-ngoai-van' }
  ];

  categoryMap: { [key: string]: string } = {
    'sach-trong-nuoc': 'Sách Trong Nước',
    'manga': 'Truyện tranh - Manga',
    'vpp-dung-cu-hoc-sinh': 'VPP - Dụng cụ học tập',
    'do-choi': 'Đồ chơi',
    'lam-dep': 'Làm đẹp',
    'sach-tham-khao': 'Sách tham khảo',
    'sach-ngoai-van': 'Sách ngoại văn'
  };
  

  constructor(private http: HttpClient, private authorService: AuthorService) {}

  ngOnInit(): void {
    
    this.filteredProducts = this.products;
    this.authorService.getAuthors().subscribe(data => {
      this.authors = data;
      this.fetchProducts();
    });
  }

  getCategoryLabel(slug: string): string {
    return this.categoryMap[slug] || slug;
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
    this.http.get<any[]>('https://book-store-3-svnz.onrender.com/books').subscribe({
      next: data => {

        this.products = data.map(book => {
          let authorObj = { name: 'Không rõ', _id: '' };

          if (typeof book.author === 'object' && book.author?.name) {
            authorObj = {
              _id: book.author._id || '',
              name: book.author.name
            };
          } else if (typeof book.author === 'string') {
            const found = this.authors.find(a => a._id === book.author);
            if (found) {
              authorObj = {
                _id: found._id || '',
                name: found.name || 'Không rõ'
              };
            } else {
              authorObj = { _id: book.author, name: 'Không rõ' };
            }
          }

          return {
            ...book,
            id: book._id,
            author: authorObj
          };
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
      p.author.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query)
    );
  }

  deleteSelectedProducts() {
    if (this.selectedProducts && this.selectedProducts.length) {
      this.filteredProducts = this.filteredProducts.filter(p => !this.selectedProducts.includes(p));
      this.selectedProducts = [];
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

    if (this.isEditMode) {
      if (!this.editingProduct?.id) {
        console.error('Không có ID sản phẩm để cập nhật');
        return;
      }

      this.editingProduct.coverImage = this.productForm.coverImage;
      this.editingProduct.images = additionalImages;
      this.editingProduct.author = selectedAuthor || { _id: '', name: 'Không rõ' };

      this.http.put(`https://book-store-3-svnz.onrender.com/books/${this.editingProduct.id}`, this.editingProduct).subscribe({
        next: () => {
          this.fetchProducts();
          this.resetDialog();
        },
        error: (err) => console.error('Lỗi khi cập nhật sản phẩm', err)
      });

    } else {
      this.newProduct.coverImage = this.productForm.coverImage;
      this.newProduct.images = additionalImages;
      this.newProduct.author = selectedAuthor || { _id: '', name: 'Không rõ' };

      this.http.post(`https://book-store-3-svnz.onrender.com/books`, this.newProduct).subscribe({
        next: () => {
          this.fetchProducts();
          this.resetDialog();
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
          console.log('Đã xoá sản phẩm');
        },
        error: (err) => console.error('Lỗi khi xoá sản phẩm', err)
      });
    }
  }
}
