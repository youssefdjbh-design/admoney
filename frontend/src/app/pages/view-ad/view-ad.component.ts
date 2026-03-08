import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { AdsService } from '../../core/ads.service';

@Component({
  selector: 'app-view-ad',
  standalone: true,
  imports: [NgIf],
  template: `
    <section class="card">
      <h2>View Ad</h2>
      <p class="alert" *ngIf="error">{{ error }}</p>

      <div style="background:#fff;border:1px solid #dbe3f7;border-radius:12px;padding:16px;margin:16px 0;">
        <strong>Auto Ads page enabled.</strong>
        <p style="margin:8px 0 0;color:#6a7388;">AdSense auto placement runs when ADSENSE is configured.</p>
      </div>

      <button class="btn btn-primary" (click)="viewAd()" [disabled]="loading">
        {{ loading ? 'Processing...' : 'View Ad (+1 visit)' }}
      </button>

      <p style="margin-top:14px;"><strong>Timer:</strong> {{ timer }}s</p>
    </section>
  `,
})
export class ViewAdComponent implements OnInit {
  loading = false;
  error = '';
  timer = 10;

  constructor(private http: HttpClient, private ads: AdsService) {}

  ngOnInit(): void {
    this.ads.enableAutoAds();
  }

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
