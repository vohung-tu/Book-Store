import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

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
  ],
  templateUrl: './admin-product.component.html',
  styleUrls: ['./admin-product.component.scss']
})
export class AdminProductComponent {
  products: any[] = [];
  displayAddDialog = false;
  editingProduct: any = null;
  isEditMode = false;
  searchText: string = '';
  filteredProducts: any[] = [];
  selectedProducts: any[] = [];

  newProduct = {
    title: '',
    author: '',
    description: '',
    price: 0,
    flashsale_price: 0,
    discount_percent: 0,
    publishedDate: '',
    categoryName: '',
    coverImage: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProducts();
    this.filteredProducts = this.products;
  }

  fetchProducts() {
    this.http.get<any[]>('http://localhost:3000/books').subscribe({
      next: data => {
        this.products = data.map(book => ({
          ...book,
          id: book._id    // gán _id thành id để phù hợp với dataKey
        }));
        this.filteredProducts = data.map(book => ({
          ...book,
          id: book._id    // gán _id thành id để phù hợp với dataKey
        }));
      },
      error: err => console.error('Lỗi khi lấy danh sách sản phẩm', err)
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

  saveProduct() {
    if (this.isEditMode) {
      if (!this.editingProduct?.id) {
        console.error('Không có ID sản phẩm để cập nhật');
        return;
      }
  
      this.http.put(`http://localhost:3000/books/${this.editingProduct.id}`, this.editingProduct).subscribe({
        next: () => {
          this.fetchProducts();
          this.resetDialog();
        },
        error: (err) => console.error('Lỗi khi cập nhật sản phẩm', err)
      });
    } else {
      this.http.post(`http://localhost:3000/books`, this.newProduct).subscribe({
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
      author: '', 
      description: '',
      price: 0, 
      flashsale_price: 0, 
      discount_percent: 0,
      publishedDate: '', 
      categoryName: '', 
      coverImage: ''
    };
  }

  get productForm() {
    return this.isEditMode ? this.editingProduct : this.newProduct;
  }

  editProduct(product: any) {
    this.isEditMode = true;
    this.editingProduct = { ...product };
    this.newProduct = { ...product };   
    this.displayAddDialog = true;
  }
  
  deleteProduct(product: any) {
    if (confirm(`Bạn có chắc muốn xoá sản phẩm "${product.title}"?`)) {
      this.http.delete(`http://localhost:3000/books/${product.id}`).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          console.log('Đã xoá sản phẩm');
        },
        error: (err) => console.error('Lỗi khi xoá sản phẩm', err)
      });
    }
  }
}
