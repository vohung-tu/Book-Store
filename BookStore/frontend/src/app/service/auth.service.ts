import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, of, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../model/users-details.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_URL = 'http://localhost:3000/auth';
  private isBrowser: boolean;

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private usernameSubject = new BehaviorSubject<string | null>(null);
  username$ = this.usernameSubject.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.restoreSession(); // ✅ Khôi phục trạng thái đăng nhập khi load lại trang
    }
  }

  /**
   * ✅ Khôi phục session khi load lại trang
   */
  private restoreSession() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      this.isLoggedInSubject.next(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        this.userSubject.next(user);
        this.usernameSubject.next(user.username);
      } else {
        this.getUserInfo().subscribe();
      }
    } else {
      this.isLoggedInSubject.next(false);
    }
  }
  signup(user: any): Observable<any> {
    return this.http.post(`${this.API_URL}/signup`, user);
  }
  /**
   * ✅ Đăng nhập
   */
  signin(credentials: any, rememberMe: boolean): Observable<any> {
    return this.http.post(`${this.API_URL}/signin`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          this.saveToken(res.token, rememberMe);
          this.getUserInfo().subscribe();
        }
      })
    );
  }

  setUsername(username: string) {
    this.usernameSubject.next(username);
  }

  /**
   *  Lấy thông tin user
   */
  getUserInfo(): Observable<User | null> {
    if (typeof window === 'undefined') {
      return of(null); // Tránh gọi `localStorage` trên server
  }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return EMPTY;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<User>(`${this.API_URL}/user-info`, { headers }).pipe(
      tap((user: User) => {
        if (user && user.username) {
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          this.usernameSubject.next(user.username);
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  /**
   * Lưu token (Remember Me)
   */
  private saveToken(token: string, rememberMe: boolean) {
    if (this.isBrowser) {
      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
      this.isLoggedInSubject.next(true);
    }
  }

  /**
   *  Đăng xuất
   */
  signout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      this.isLoggedInSubject.next(false);
      this.userSubject.next(null);
      this.usernameSubject.next(null);
    }
  }

  /**
   * ✅ Kiểm tra trạng thái đăng nhập
   */
  isAuthenticated(): boolean {
    return this.isBrowser && !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }
}
