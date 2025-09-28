import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  reply: string;
  quotes: { _id: string; title: string; price: number; slug?: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly baseUrl = 'https://book-store-3-svnz.onrender.com/chat'; // đổi nếu backend của bạn ở domain khác

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatResponse> {
    const token = localStorage.getItem('token'); // token bạn lưu khi login
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<ChatResponse>(this.baseUrl, { message }, { headers });
  }

  getHistory(): Observable<{ role: 'user' | 'bot'; content: string; createdAt: string }[]> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.get<{ role: 'user' | 'bot'; content: string; createdAt: string }[]>(
      `${this.baseUrl}/history`,
      { headers }
    );
  }

  getWelcome(): Observable<{ reply: string }> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.get<{ reply: string }>(`${this.baseUrl}/welcome`, { headers });
  }
}
