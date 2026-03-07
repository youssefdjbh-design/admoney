import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf],
  template: `
    <section class="card" style="max-width:540px;margin:auto;">
      <h2>Login</h2>
      <p class="alert" *ngIf="error">{{ error }}</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label>Email</label>
          <input type="email" formControlName="email" />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" formControlName="password" />
        </div>
        <button class="btn btn-primary" [disabled]="form.invalid || loading">
          {{ loading ? 'Please wait...' : 'Login' }}
        </button>
      </form>
      <p style="margin-top:14px;">No account? <a routerLink="/signup">Sign up</a></p>
    </section>
  `,
})
export class LoginComponent {
  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.getRawValue();
    this.auth.login(email || '', password || '').subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err) => {
        this.error = err?.error?.error || 'Login failed';
        this.loading = false;
      },
    });
  }
}
