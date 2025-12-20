import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { filter, map } from 'rxjs';
import { environment } from './environment/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID); 


  protected userAvatar = signal<string | null>(null);
  protected userName = signal<string>('User');

 
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    )
  );

  ngOnInit() {
   
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
    }
  }

  private loadUserData() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      console.log("UserInfo", userInfo);
      try {
        const user = JSON.parse(userInfo);
        this.userAvatar.set(user.avatar || null);
        this.userName.set(user.name || 'User');
      } catch (e) {
        console.error("Could not parse userInfo from localStorage", e);
      }
    }
  }

  protected hideSidebar() {
    const url = this.currentUrl() || '';
    return url.includes('/login') || url.includes('/register');
  }

 
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.uploadAvatar(file);
    }
  }

  private uploadAvatar(file: File): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const formData = new FormData();
    formData.append('avatar', file); 

    const userInfoStr = localStorage.getItem('userInfo');
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};
    
   
    const token = userInfo.token || localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

   
    this.http.put<any>(`${environment.apiUrl}/auth/avatar`, formData, { headers })
      .subscribe({
        next: (res) => {
       
          this.userAvatar.set(res.avatar);

          const updatedUser = { ...userInfo, avatar: res.avatar };
          localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        },
        error: (err) => {
          console.error('Upload failed', err);
          alert(err.error?.message || 'Failed to upload profile picture');
        }
      });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    }
    this.userAvatar.set(null);
    this.userName.set('User');
    this.router.navigate(['/login']);
  }
}