import { Component, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
 styleUrls: ['./register.css'],
})
export class Register {
 
  registerForm: FormGroup;
  loading = false;
  successMessage = signal(''); 

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
goToLogin() {
  this.router.navigate(['/login']);
}

 submit() {
  if (this.registerForm.invalid) return;

  this.loading = true;

  const payload = {
    name: this.registerForm.value.name,
    email: this.registerForm.value.email,
    password: this.registerForm.value.password,
  };

  this.authService.register(payload).subscribe({
    next: (res) => {
      console.log('Registered successfully');

       this.successMessage.set('Registered successfully! Redirecting into login'); 

      this.loading = false;

        setTimeout(() => this.router.navigate(['/login']), 2000);
    },
    error: (err) => {
      console.error('Register error', err);
      this.loading = false;
    }
  });
}
}
