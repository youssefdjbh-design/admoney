import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

@Component({
  selector: 'app-view-ad',
  standalone: true,
  imports: [NgIf],
  template: `
    <section class="card">
      <h2>View Ad</h2>
      <p class="alert" *ngIf="error">{{ error }}</p>

      <div *ngIf="adsenseEnabled && adsenseClientId; else adFallback"
           style="background:#fff;border:1px solid #dbe3f7;border-radius:12px;padding:16px;margin:16px 0;">
        <strong>Auto Ads enabled for this page.</strong>
        <p style="margin:8px 0 0;color:#6a7388;">AdSense will place ads automatically on this page layout.</p>
      </div>

      <ng-template #adFallback>
        <div style="background:#111;color:#fff;border-radius:12px;padding:50px;text-align:center;margin:16px 0;">
          <h3>Advertisement Space</h3>
          <p>Set ADSENSE_ENABLED=true and ADSENSE_CLIENT_ID on Render.</p>
        </div>
      </ng-template>

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
  adsenseEnabled = false;
  adsenseClientId = '';
  adReady = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ adsenseEnabled: boolean; adsenseClientId: string }>('/api/config').subscribe({
      next: (cfg) => {
        this.adsenseEnabled = cfg.adsenseEnabled;
        this.adsenseClientId = cfg.adsenseClientId;
        if (this.adsenseEnabled && this.adsenseClientId) {
          this.loadAdScript();
        }
      },
      error: () => {
        this.adsenseEnabled = false;
      },
    });
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

  private loadAdScript(): void {
    const existing = document.querySelector('script[data-adsense="true"]');
    if (existing) {
      this.pushAd();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adsenseClientId}`;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-adsense', 'true');
    script.onload = () => this.pushAd();
    document.head.appendChild(script);
  }

  private pushAd(): void {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({
        google_ad_client: this.adsenseClientId,
        enable_page_level_ads: true,
      });
      this.adReady = true;
    } catch {
      this.adReady = false;
    }
  }
}
