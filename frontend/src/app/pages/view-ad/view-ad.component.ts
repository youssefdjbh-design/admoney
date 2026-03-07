import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-view-ad',
  standalone: true,
  imports: [NgIf],
  template: `
    <section class="card">
      <h2>View Ad</h2>
      <p class="alert" *ngIf="error">{{ error }}</p>

      <div style="background:#111;color:#fff;border-radius:12px;padding:50px;text-align:center;margin:16px 0;">
        <h3>Advertisement Space</h3>
        <p>Rate limit: 1 request / 5 seconds</p>
      </div>

      <button class="btn btn-primary" (click)="viewAd()" [disabled]="loading">
        {{ loading ? 'Processing...' : 'View Ad (+1 visit)' }}
      </button>

      <p style="margin-top:14px;"><strong>Timer:</strong> {{ timer }}s</p>
    </section>
  `,
})
export class ViewAdComponent {
  loading = false;
  error = '';
  timer = 10;

  constructor(private http: HttpClient) {}

  viewAd(): void {
    this.loading = true;
    this.error = '';

    this.http.post('/api/view-ad', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.loading = false;
        this.startTimer();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Request failed';
        this.loading = false;
      },
    });
  }

  private startTimer(): void {
    this.timer = 10;
    const interval = setInterval(() => {
      this.timer -= 1;
      if (this.timer <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }
}
