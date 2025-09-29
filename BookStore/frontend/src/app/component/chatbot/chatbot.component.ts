import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatService, ChatResponse } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { marked } from 'marked';
import {
  trigger,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  animations: [
    trigger('slideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class ChatbotComponent implements OnInit {
  open = false;
  input = '';
  loading = false;
  messages: { role: 'user' | 'bot'; content: string; quotes?: ChatResponse['quotes']; type?: 'suggestion' }[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    marked.use({ async: false });
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.chatService.getHistory().subscribe({
        next: (history) => {
          this.messages = history.map((m) => ({
            role: m.role,
            content: m.content
          }));
        },
        error: (err) => console.error('❌ Load history error:', err)
      });
    }
  }

  formatMessage(content: string): SafeHtml {
    const rawHtml = marked(content, { breaks: true }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  toggle() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/signin']);
      return;
    }

    this.open = !this.open;

    if (this.open && this.messages.length === 0) {
      this.messages.push({
        role: 'bot',
        type: 'suggestion',
        content: 'Nhấn <b>Bắt đầu</b> để trò chuyện với trợ lý AI 👇'
      });
    }
  }

  startChat() {
    this.chatService.getWelcome().subscribe((res) => {
      this.messages.push({ role: 'bot', content: res.reply });
    });
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
