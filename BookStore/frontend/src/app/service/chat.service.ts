import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  reply: string;
  quotes?: {
    _id: string;
    title: string;
    price: number;
    slug?: string;
    link?: string;
    coverImage?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly baseUrl = 'https://book-store-3-svnz.onrender.com/chat'; 

  constructor(private http: HttpClient) {}

  private createAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  /* Gửi tin nhắn người dùng đến AI */
  sendMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      this.baseUrl,
      { message },
      { headers: this.createAuthHeaders() }
    );
  }

  getHistory(): Observable<{ role: 'user' | 'bot'; content: string; createdAt: string }[]> {
    return this.http.get<{ role: 'user' | 'bot'; content: string; createdAt: string }[]>(
      `${this.baseUrl}/history`,
      { headers: this.createAuthHeaders() }
    );
  }

  getWelcome(): Observable<{ reply: string }> {
    return this.http.get<{ reply: string }>(
      `${this.baseUrl}/welcome`,
      { headers: this.createAuthHeaders() }
    );
  }
}
