import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.post<ChatResponse>(this.baseUrl, { message });
  }
}
