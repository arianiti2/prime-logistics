import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common'; 

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object 
  ) {}

canActivate(): boolean {
  // If we are on the server, allow navigation to proceed.
  // The browser will boot up and re-check this immediately.
  if (!isPlatformBrowser(this.platformId)) {
    return true; 
  }

  // Now we are safely in the browser
  const token = localStorage.getItem('token');
  if (token) {
    return true;
  }

  // No token found in browser, redirect to login
  this.router.navigate(['/login']);
  return false;
}
}