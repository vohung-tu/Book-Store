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

 // Lấy danh sách sách từ backend và ánh xạ _id (mongo) -> id
  getBooks(): Observable<BookDetails[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const books = Array.isArray(res) ? res : res.items || [];
        return books.map((book: any) => ({
          ...book,
          id: book._id
        }));
      })
    );
  }

// Lấy chi tiết sách theo ID từ backend và ánh xạ _id -> id
  getBookById(id: string): Observable<BookDetails> {
    return this.http.get<BookDetails>(`${this.apiUrl}/${id}`).pipe(
      map(book => ({
        ...book,
        id: book._id, // Chuyển _id thành id
        summary_ai: book['summary_ai'] || '' // Lấy thêm summary_ai từ BE
      }))
    );
  }

  generateSummary(id: string): Observable<BookDetails> {
    return this.http.post<BookDetails>(`${this.apiUrl}/${id}/summary-ai`, {});
  }

  // lấy books by category
  getProductsByCategory(categorySlug: string, page = 1, limit = 20): Observable<BookDetails[]> {
    return this.http.get<{ items: BookDetails[]; total: number; page: number; pages: number }>(
      this.apiUrl,
      { params: { category: categorySlug, page, limit } }
    ).pipe(
      map(res => (res.items ?? []).map(b => ({ ...b, id: (b as any)._id })))
    );
  }

  searchBooks(keyword: string): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(
      `${this.apiUrl}/search`,
      { params: { keyword } }
    );
  }

  getBestSellers(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/best-sellers`);
  }

  getFeaturedBooks() {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/featured`);
  }

  getNewReleases() {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/new-releases`);
  }

  getIncomingReleases(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/incoming`);
  }

  getReferenceBooks() {
    return this.http.get<{ sachThamKhao: BookDetails[], sachTrongNuoc: BookDetails[] }>(
      `${this.apiUrl}/reference`
    );
  }

  getSummary(id: string): Observable<string> {
    return this.http.get<{ summary_ai: string }>(`${this.apiUrl}/${id}/summary-ai`)
      .pipe(map(res => res.summary_ai));
  }

  getRecommendedBooks(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/recommend`);
  }

  getHalloweenBooks(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/halloween`);
  }

  getAdminBooks(
    page = 1,
    limit = 40,
    search = ''
  ) {
    return this.http.get<any>(`${this.apiUrl}/list`, {
      params: {
        page,
        limit,
        search
      }
    });
  }

  getAdminDetail(id: string) {
    return this.http.get<any>(`${this.apiUrl}/admin/${id}`);
  }

  getRelatedBooksAI(bookId: string): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/related-ai/${bookId}`);
  }

  getRelatedAls(id: string): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/related-als/${id}`);
  }

  getRecentViewed(userId: string) {
    return this.http.get<BookDetails[]>(`https://book-store-3-svnz.onrender.com/view-history/${userId}`);
  }

  getUserRecommend(userId: string) {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/recommend-user/${userId}`);
  }

  updateBook(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

}   
