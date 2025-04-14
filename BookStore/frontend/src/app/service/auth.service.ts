import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, of, switchMap, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../model/users-details.model';
import { Router } from '@angular/router';

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
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.restoreSession(); // ✅ Khôi phục trạng thái đăng nhập khi load lại trang
    }
  }

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

  signin(credentials: any, rememberMe: boolean): Observable<any> {
    return this.http.post(`${this.API_URL}/signin`, credentials).pipe(
      tap((res: any) => {
        if (res.token && res.user) {
          this.saveToken(res.token, rememberMe);
          localStorage.setItem('user', JSON.stringify(res.user)); // Lưu user info
          this.saveUserInfo(res.user, rememberMe); 
        }
      })
    );
  }
  
  setUsername(username: string) {
    this.usernameSubject.next(username);
  }

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

  saveUserInfo(user: any, rememberMe: boolean) {
    const userInfo = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem('user', userInfo);
    } else {
      sessionStorage.setItem('user', userInfo);
    }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    if (!this.isBrowser) {
      return null;
    }
  
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  signout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      this.isLoggedInSubject.next(false);
      this.userSubject.next(null);
      this.usernameSubject.next(null);
      // Điều hướng người dùng về trang login sau khi đăng xuất
      this.router.navigate(['/signin']);
    }
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem('token');
  }

  getUserRole(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.role || '';
  }

  isAuthenticated(): boolean {
    return this.isBrowser && !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }
}
