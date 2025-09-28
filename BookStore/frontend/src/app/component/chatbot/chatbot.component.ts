import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';

@Component({
  selector: 'app-chatbot',
  standalone: true,
    imports: [
      CommonModule,
      FormsModule
    ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  animations: [
    trigger('slideFade', [
      transition(':enter', [ // Khi element được thêm vào DOM
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [ // Khi element bị xóa khỏi DOM
        animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class ChatbotComponent {
  open = false;
  input = '';
  messages: { role: 'user' | 'bot'; content: string }[] = [];

  constructor(private http: HttpClient) {}

  toggle() {
    this.open = !this.open;
  }

  send() {
    if (!this.input.trim()) return;

    this.messages.push({ role: 'user', content: this.input });

    this.http.post<{ reply: string }>('/api/chat', { message: this.input })
      .subscribe({
        next: (res) => {
          this.messages.push({ role: 'bot', content: res.reply });
        },
        error: () => {
          this.messages.push({ role: 'bot', content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.' });
        }
      });

    this.input = '';
  }
}
