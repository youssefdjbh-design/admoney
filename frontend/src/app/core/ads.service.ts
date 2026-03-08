import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private initialized = false;
  private loading = false;

  constructor(private http: HttpClient) {}

  enableAutoAds(): void {
    if (this.initialized || this.loading) {
      return;
    }

    this.loading = true;
    this.http
      .get<{ adsenseEnabled: boolean; adsenseClientId: string }>('/api/config')
      .subscribe({
        next: (cfg) => {
          if (!cfg.adsenseEnabled || !cfg.adsenseClientId) {
            this.loading = false;
            return;
          }
          this.loadScript(cfg.adsenseClientId);
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private loadScript(clientId: string): void {
    const existing = document.querySelector('script[data-adsense="true"]') as HTMLScriptElement | null;
    if (existing) {
      this.pushAutoAds(clientId);
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-adsense', 'true');
    script.onload = () => this.pushAutoAds(clientId);
    script.onerror = () => {
      this.loading = false;
    };
    document.head.appendChild(script);
  }

  private pushAutoAds(clientId: string): void {
    const w = window as Window & { adsbygoogle?: unknown[] };
    try {
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({
        google_ad_client: clientId,
        enable_page_level_ads: true,
      });
      this.initialized = true;
    } finally {
      this.loading = false;
    }
  }
}
