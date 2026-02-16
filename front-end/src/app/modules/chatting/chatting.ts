import { 
  Component, 
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

@Component({
  selector: 'app-chatting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatting.html',
  styleUrl: './chatting.css'
})
export class Chatting implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private socket!: Socket;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // State Management
  public currentUser = this.authService.currentUser(); 
  public messages = signal<any[]>([]);
  public pendingRequests = signal<any[]>([]);
  public friendsList = signal<any[]>([]);
  public allEmails = signal<string[]>([]);
  public showEmailSuggestions = signal<boolean>(false);
  public activeChat = signal<any>(null);
  
  // Typing State
  public isFriendTyping = signal<boolean>(false);
  private typingTimeout: any;

  // Inputs
  public emailSearch = '';
  public newMessage = '';
  private emailBlurTimeout: any;

  constructor() {
    effect(() => {
      this.messages(); 
      this.scrollToBottom();
    });
  }

  ngOnInit() {
    if (!this.currentUser || !this.currentUser._id) return;

    this.socket = io('http://localhost:5000');
    
    this.socket.emit('join_room', this.currentUser._id);

    this.socket.on('load_history', (history) => {
      this.messages.set(history);
    });

    this.socket.on('receive_message', (msg: any) => {
      this.messages.update(prev => [...prev, msg]);
    });

    // Typing Listener
    this.socket.on('user_typing', (data: any) => {
      // Only show typing if it's the person we are currently looking at
      if (this.activeChat()?._id === data.senderId) {
        this.isFriendTyping.set(data.isTyping);
      }
    });

    this.loadPendingRequests();
    this.loadFriends();
    this.loadAllEmails();
  }

  public filteredMessages = computed(() => {
    const activeId = this.activeChat()?._id;
    const currentId = this.currentUser._id;
    if (!activeId) return [];

    return this.messages().filter(m => 
      (m.senderId === currentId && m.recipientId === activeId) ||
      (m.senderId === activeId && m.recipientId === currentId)
    );
  });

  public filteredEmails = computed(() => {
    const query = this.emailSearch.trim().toLowerCase();
    const emails = this.allEmails();

    if (!query) return emails.slice(0, 12);

    return emails
      .filter(email => email.toLowerCase().includes(query))
      .slice(0, 12);
  });

  // Call this on (input) in HTML
  onTyping() {
    if (!this.activeChat()) return;

    this.socket.emit('typing', {
      senderId: this.currentUser._id,
      recipientId: this.activeChat()._id,
      isTyping: true
    });

    // Clear previous timeout and set a new one to stop typing indicator
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('typing', {
        senderId: this.currentUser._id,
        recipientId: this.activeChat()._id,
        isTyping: false
      });
    }, 2000);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeChat()) return;

    const data = {
      senderId: this.currentUser._id,
      recipientId: this.activeChat()._id,
      text: this.newMessage
    };

    this.socket.emit('send_message', data);
    
    // Stop typing indicator immediately on send
    this.socket.emit('typing', {
      senderId: this.currentUser._id,
      recipientId: this.activeChat()._id,
      isTyping: false
    });

    this.messages.update(prev => [...prev, { ...data, createdAt: new Date() }]);
    this.newMessage = '';
  }

  sendRequest(recipientEmailInput?: string) {
    const recipientEmail = (recipientEmailInput ?? this.emailSearch).trim();
    if (!recipientEmail) return;

    this.emailSearch = recipientEmail;

    this.http.post('http://localhost:5000/api/friends/request', {
      senderId: this.currentUser._id,
      recipientEmail
    }).subscribe({
      next: () => {
        alert('Request Sent!');
        this.emailSearch = '';
        this.showEmailSuggestions.set(false);
      },
      error: (err) => alert(err.error.message)
    });
  }

  onEmailInputFocus() {
    if (this.emailBlurTimeout) clearTimeout(this.emailBlurTimeout);
    this.showEmailSuggestions.set(true);
  }

  onEmailInputBlur() {
    this.emailBlurTimeout = setTimeout(() => {
      this.showEmailSuggestions.set(false);
    }, 120);
  }

  onEmailSearchChange() {
    this.showEmailSuggestions.set(true);
  }

  selectEmail(email: string) {
    this.sendRequest(email);
  }

  loadAllEmails() {
    this.http.get<string[]>(`http://localhost:5000/api/friends/emails/${this.currentUser._id}`)
      .subscribe(res => this.allEmails.set(res));
  }

  loadPendingRequests() {
    this.http.get<any[]>(`http://localhost:5000/api/friends/pending/${this.currentUser._id}`)
      .subscribe(res => this.pendingRequests.set(res));
  }

  acceptFriendRequest(requestId: string) {
    this.http.put('http://localhost:5000/api/friends/accept', { requestId })
      .subscribe({
        next: () => {
          this.loadPendingRequests();
          this.loadFriends();
        },
        error: (err) => console.error(err)
      });
  }

  loadFriends() {
    this.http.get<any[]>(`http://localhost:5000/api/friends/accepted/${this.currentUser._id}`)
      .subscribe(res => this.friendsList.set(res));
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
