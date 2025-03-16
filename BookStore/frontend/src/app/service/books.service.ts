import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BookDetails } from '../model/books-details.model';

@Injectable({
  providedIn: 'root' // Đảm bảo service được cung cấp toàn cục
})
export class BooksService {
  private readonly apiUrl = 'http://localhost:3000/books'; //  Dùng `readonly` để tránh thay đổi URL

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
}
