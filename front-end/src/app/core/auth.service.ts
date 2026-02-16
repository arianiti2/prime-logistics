import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); // Inject platform ID
  
  public currentUser = signal<any>(this.getUserFromStorage());

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap((response: any) => {
        // Only run this if we are in the browser
        if (isPlatformBrowser(this.platformId)) {
          if (response.token) localStorage.setItem('token', response.token);
          
          const userData = response.user || response; 
          localStorage.setItem('user', JSON.stringify(userData));
          this.currentUser.set(userData);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  getUserId(): string | null {
    const user = this.currentUser();
    return user ? user._id : null;
  }

  private getUserFromStorage() {
    // Safety check for SSR: if server-side, return null
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUser.set(null);
  }
}
