import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BookDetails } from '../model/books-details.model';

@Injectable({
  providedIn: 'root' // Đảm bảo service được cung cấp toàn cục
})
export class BooksService {
  private readonly apiUrl = 'https://book-store-3-svnz.onrender.com/books'; //  Dùng `readonly` để tránh thay đổi URL

  constructor(private http: HttpClient) {}

 // Lấy danh sách sách từ backend và ánh xạ _id -> id
  getBooks(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(this.apiUrl).pipe(
      map(books =>
        books.map(book => ({
          ...book,
          id: book._id // Chuyển _id thành id
        }))
      )
    );
  }

// Lấy chi tiết sách theo ID từ backend và ánh xạ _id -> id
  getBookById(id: string): Observable<BookDetails> {
    return this.http.get<BookDetails>(`${this.apiUrl}/${id}`).pipe(
      map(book => ({
        ...book,
        id: book._id // Chuyển _id thành id
      }))
    );
  }

  // lấy books by category
  getProductsByCategory(categoryName: string): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/category/${categoryName}`);
  }

  searchBooks(keyword: string): Observable<BookDetails[]> {
    const url = `${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}`;
    return this.http
      .get<BookDetails[]>(url)
      .pipe(
        map(books =>
          books.map(book => ({
            ...book,
            id: book._id
          }))
        )
      );
  }

  getBestSellers(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/best-sellers`);
  }

}   
