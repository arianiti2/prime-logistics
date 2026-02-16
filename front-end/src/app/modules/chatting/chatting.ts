import { 
  Component, 
  OnDestroy,
  OnInit, 
  signal, 
  inject, 
  computed, 
  effect, 
  ElementRef, 
  ViewChild 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../environment/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

type UserRef = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
};

type ChatMessage = {
  senderId: string;
  recipientId: string;
  text: string;
  createdAt?: Date | string;
  timestamp?: Date | string;
};

type TypingPayload = {
  senderId: string;
  recipientId: string;
  isTyping: boolean;
};

@Component({
  selector: 'app-chatting',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './chatting.html',
  styleUrl: './chatting.css'
})
export class Chatting implements OnInit, OnDestroy {
  private static readonly EMAIL_SUGGESTIONS_LIMIT = 12;
  private static readonly TYPING_DEBOUNCE_MS = 2000;
  private static readonly EMAIL_BLUR_DELAY_MS = 120;

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private readonly apiBaseUrl = environment.apiUrl;
  private readonly socketBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  private socket!: Socket;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  public currentUser = this.authService.currentUser();
  public messages = signal<ChatMessage[]>([]);
  public pendingRequests = signal<any[]>([]);
  public friendsList = signal<UserRef[]>([]);
  public allEmails = signal<string[]>([]);
  public showEmailSuggestions = signal<boolean>(false);
  public activeChat = signal<UserRef | null>(null);
  public isFriendTyping = signal<boolean>(false);

  private typingTimeout: any;
  private emailBlurTimeout: any;

  public emailSearch = '';
  public newMessage = '';

  public filteredMessages = computed(() => {
    const activeId = this.activeChat()?._id;
    const currentId = this.currentUserId;
    if (!activeId || !currentId) return [];

    return this.messages().filter(
      (message) =>
        (message.senderId === currentId && message.recipientId === activeId) ||
        (message.senderId === activeId && message.recipientId === currentId)
    );
  });

  public filteredEmails = computed(() => {
    const query = this.emailSearch.trim().toLowerCase();
    const emails = this.allEmails();

    if (!query) return emails.slice(0, Chatting.EMAIL_SUGGESTIONS_LIMIT);

    return emails
      .filter((email) => email.toLowerCase().includes(query))
      .slice(0, Chatting.EMAIL_SUGGESTIONS_LIMIT);
  });

  constructor() {
    effect(() => {
      this.messages();
      this.scrollToBottom();
    });
  }

  ngOnInit() {
    if (!this.currentUserId) return;

    this.initializeSocket();

    this.loadPendingRequests();
    this.loadFriends();
    this.loadAllEmails();
  }

  ngOnDestroy(): void {
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (this.emailBlurTimeout) clearTimeout(this.emailBlurTimeout);
    if (this.socket) this.socket.disconnect();
  }

  onTyping() {
    if (!this.activeChat()) return;

    this.emitTyping(true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.emitTyping(false);
    }, Chatting.TYPING_DEBOUNCE_MS);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeChat()) return;

    const data: ChatMessage = {
      senderId: this.currentUserId,
      recipientId: this.activeChat()!._id,
      text: this.newMessage.trim()
    };

    this.socket.emit('send_message', data);

    this.emitTyping(false);
    this.messages.update((previous) => [...previous, { ...data, createdAt: new Date() }]);
    this.newMessage = '';
  }

  sendRequest(recipientEmailInput?: string) {
    const recipientEmail = (recipientEmailInput ?? this.emailSearch).trim();
    if (!recipientEmail) return;

    this.emailSearch = recipientEmail;

    this.http.post(`${this.apiBaseUrl}/friends/request`, {
      senderId: this.currentUserId,
      recipientEmail
    }).subscribe({
      next: () => {
          this.snackBar.open('Friend request sent successfully 🎉', 'Close', {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    panelClass: ['success-snackbar']
  });
        this.emailSearch = '';
        this.showEmailSuggestions.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Failed to send request', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onEmailInputFocus() {
    if (this.emailBlurTimeout) clearTimeout(this.emailBlurTimeout);
    this.showEmailSuggestions.set(true);
  }

  onEmailInputBlur() {
    this.emailBlurTimeout = setTimeout(() => {
      this.showEmailSuggestions.set(false);
    }, Chatting.EMAIL_BLUR_DELAY_MS);
  }

  onEmailSearchChange() {
    this.showEmailSuggestions.set(true);
  }

  selectEmail(email: string) {
    this.sendRequest(email);
  }

  loadAllEmails() {
    this.http
      .get<string[]>(`${this.apiBaseUrl}/friends/emails/${this.currentUserId}`)
      .subscribe((emails) => this.allEmails.set(emails));
  }

  loadPendingRequests() {
    this.http
      .get<any[]>(`${this.apiBaseUrl}/friends/pending/${this.currentUserId}`)
      .subscribe((requests) => this.pendingRequests.set(requests));
  }

  acceptFriendRequest(requestId: string) {
    this.http.put(`${this.apiBaseUrl}/friends/accept`, { requestId })
      .subscribe({
        next: () => {
          this.loadPendingRequests();
          this.loadFriends();
        },
        error: (err) => console.error(err)
      });
  }

  loadFriends() {
    this.http
      .get<UserRef[]>(`${this.apiBaseUrl}/friends/accepted/${this.currentUserId}`)
      .subscribe((friends) => this.friendsList.set(friends));
  }

  private initializeSocket(): void {
    this.socket = io(this.socketBaseUrl);

    this.socket.on('connect', () => {
      this.socket.emit('join_room', this.currentUserId);
    });

    this.socket.on('load_history', (history: ChatMessage[]) => {
      this.messages.set(history ?? []);
    });

    this.socket.on('receive_message', (message: ChatMessage) => {
      this.messages.update((previous) => [...previous, message]);
    });

    this.socket.on('user_typing', (data: TypingPayload) => {
      const activeId = this.activeChat()?._id;
      if (activeId && activeId === data?.senderId) {
        this.isFriendTyping.set(Boolean(data?.isTyping));
      }
    });
  }

  private emitTyping(isTyping: boolean): void {
    const activeId = this.activeChat()?._id;
    if (!activeId || !this.currentUserId) return;

    this.socket.emit('typing', {
      senderId: this.currentUserId,
      recipientId: activeId,
      isTyping
    });
  }

  private get currentUserId(): string {
    return this.currentUser?._id || '';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
