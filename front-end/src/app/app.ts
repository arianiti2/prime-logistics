import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

   private readonly router = inject(Router);

  logout(): void {
    localStorage.removeItem('token'); 
    
    this.router.navigate(['/login']);
  }
}