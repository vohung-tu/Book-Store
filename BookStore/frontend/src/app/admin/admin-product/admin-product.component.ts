import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

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
  ],
  templateUrl: './admin-product.component.html',
  styleUrls: ['./admin-product.component.scss']
})
export class AdminProductComponent {
  products: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts() {
    this.http.get<any[]>('http://localhost:3000/books').subscribe({
      next: (data) => this.products = data,
      error: (err) => console.error('Lỗi khi lấy danh sách sản phẩm', err)
    });
  }
}
