import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Author } from '../model/author.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private apiUrl = 'http://localhost:3000/authors';

  constructor(private http: HttpClient) {}

  getAuthors(): Observable<Author[]> {
    return this.http.get<Author[]>(this.apiUrl);
  }

  addAuthor(authorData: FormData): Observable<any> {
    return this.http.post('http://localhost:3000/authors', authorData);
  }

  updateAuthor(id: string, authorData: FormData): Observable<any> {
    return this.http.put(`http://localhost:3000/authors/${id}`, authorData);
  }

  deleteAuthor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getAuthorById(id: string): Observable<any> {
    return this.http.get(`http://localhost:3000/authors/${id}`);
  }

}
