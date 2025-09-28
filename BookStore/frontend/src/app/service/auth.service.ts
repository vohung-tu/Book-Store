import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, EMPTY, map, Observable, of, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Address, User } from '../model/users-details.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_URL = 'https://book-store-3-svnz.onrender.com/auth';
  private isBrowser: boolean;

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private usernameSubject = new BehaviorSubject<string | null>(null);
  username$ = this.usernameSubject.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  authStatusChanged = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.restoreSession(); // ✅ Tự động đăng nhập nếu còn session
    }
  }

  private restoreSession() {
    const token = sessionStorage.getItem('token');
    if (token) {
      this.isLoggedInSubject.next(true);
      const storedUser = sessionStorage.getItem('user');
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

  signin(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/signin`, credentials).pipe(
      tap((res: any) => {
        if (res.token && res.user) {
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
          this.usernameSubject.next(res.user.username);
          this.isLoggedInSubject.next(true);
          this.authStatusChanged.next(true);
        }
      })
    );
  }

  updatePassword(payload: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Observable<any> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Chỉ gửi phần body cần thiết
    const body = {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword
    };

    return this.http.patch(
      `${this.API_URL}/${payload.userId}/update-password`,
      body,
      { headers }
    );
  }

  setUsername(username: string) {
    this.usernameSubject.next(username);
  }

  getUserInfo(): Observable<User | null> {
    if (!this.isBrowser) return of(null);
    const token = sessionStorage.getItem('token');
    if (!token) return EMPTY;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<User>(`${this.API_URL}/user-info`, { headers }).pipe(
      tap((user: User) => {
        if (user && user.username) {
          sessionStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          this.usernameSubject.next(user.username);
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`https://book-store-3-svnz.onrender.com/auth/check-email?email=${email}`)
      .pipe(map(res => res.exists));
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getProfile(): Observable<User | null> {
    const token = this.getToken();
    if (!token) return of(null);

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<User>(`${this.API_URL}/me`, { headers }).pipe(
      tap(user => {
        if (user) {
          sessionStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}`).pipe(
      tap(users => console.log('Danh sách users:', users)) // Kiểm tra dữ liệu trong console
    );
  }

  signout(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      this.isLoggedInSubject.next(false);
      this.userSubject.next(null);
      this.usernameSubject.next(null);
      this.router.navigate(['/signin']);
      this.authStatusChanged.next(false);
    }
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return !!sessionStorage.getItem('token');
  }

  getUserRole(): string {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user?.role || '';
  }

  isAuthenticated(): boolean {
    return this.isBrowser && !!sessionStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    if (!this.isBrowser) return null;
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user: User): void {
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  getAddresses(userId: string): Observable<any> {
    const token = sessionStorage.getItem('token');
    return this.http.get(`${this.API_URL}/${userId}/addresses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  updateAddress(userId: string, addresses: Address[]): Observable<User> {
    const token = sessionStorage.getItem('token');
    return this.http.patch<User>(`${this.API_URL}/${userId}/address`, { address: addresses }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  getTotalUsers(): Observable<number> {
    return this.http.get<User[]>(`${this.API_URL}`).pipe(
      tap(users => console.log("Danh sách users:", users)), // Kiểm tra dữ liệu trả về
      map(users => users.length) // Trả về tổng số lượng users
    );
  }

  requestPasswordReset(email: string) {
    return this.http.post<{ message: string; resetToken?: string }>(
      'https://book-store-3-svnz.onrender.com/auth/forgot-password', // hoặc env
      { email }
    );
  }

  updateUser(user: User) {
    return this.http.put(`${this.API_URL}/update/${user._id}`, user);
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.API_URL}/reset-password-link`, { token, newPassword });
  }
}
