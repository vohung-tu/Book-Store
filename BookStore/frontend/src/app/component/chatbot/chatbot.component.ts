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
import { ChatResponse, ChatService } from '../../service/chat.service';

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
  loading = false;
  messages: { role: 'user' | 'bot'; content: string; quotes?: ChatResponse['quotes'] }[] = [];

  constructor(private chatService: ChatService) {}

  toggle() {
    this.open = !this.open;
  }

  send() {
    const text = this.input.trim();
    if (!text) return;

    this.messages.push({ role: 'user', content: text });
    this.loading = true;
    this.input = '';

    this.chatService.sendMessage(text).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', content: res.reply, quotes: res.quotes });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: 'bot', content: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.' });
        this.loading = false;
      }
    });
  }
}
