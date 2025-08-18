import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { Category } from '../model/books-details.model';
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'https://book-store-3-svnz.onrender.com/admin/categories';
  
  private headers() { return { Authorization: `Bearer ${this.auth.getToken()}`  }; };
  private list$ = new BehaviorSubject<Category[]>([]);
  constructor(private http: HttpClient, private auth: AuthService) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl, { headers: this.headers() });
  }

  list()   { 
    return this.http.get<any[]>(this.apiUrl, { headers: this.headers() }); 
  }
  create(body: { name: string; slug?: string }) { 
    return this.http.post(this.apiUrl, body, { headers: this.headers() });
  }
  update(id: string, body: { name?: string; slug?: string }) { 
    return this.http.patch(`${this.apiUrl}/${id}`, body, { headers: this.headers() }); 
  }
  remove(id: string) { 
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.headers() }); 
  }

  loadOnce() {
    if (this.list$.value.length) return of(this.list$.value);
    return this.http.get<Category[]>('https://book-store-3-svnz.onrender.com/categories')
      .pipe(tap(cats => this.list$.next(cats as Category[])));
  }

  nameOf(slugOrObj: string | Category): string {
    if (typeof slugOrObj !== 'string') return slugOrObj?.name ?? '';
    const hit = this.list$.value.find(c => c.slug === slugOrObj);
    return hit?.name ?? slugOrObj; // fallback nếu chưa có
  }

  slugOf(slugOrObj: string | Category): string {
    return typeof slugOrObj === 'string' ? slugOrObj : (slugOrObj?.slug ?? '');
  }
}
