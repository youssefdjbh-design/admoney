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
          this.pushAutoAds(cfg.adsenseClientId);
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private pushAutoAds(clientId: string): void {
    const script = document.querySelector('script[data-adsense="true"]') as HTMLScriptElement | null;
    if (!script) {
      this.loading = false;
      return;
    }

    if (!script.src.includes(clientId)) {
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    }

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
