import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Author } from '../model/author.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private apiUrl = 'https://book-store-3-svnz.onrender.com/authors';

  constructor(private http: HttpClient) {}

  getAuthors(): Observable<Author[]> {
    return this.http.get<Author[]>(this.apiUrl);
  }

  addAuthor(authorData: FormData): Observable<any> {
    return this.http.post('https://book-store-3-svnz.onrender.com/authors', authorData);
  }

  updateAuthor(id: string, authorData: FormData): Observable<any> {
    return this.http.put(`https://book-store-3-svnz.onrender.com/authors/${id}`, authorData);
  }

  deleteAuthor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getAuthorById(id: string): Observable<Author> {
    return this.http.get<Author>(`${this.apiUrl}/${id}`);
  }

}
