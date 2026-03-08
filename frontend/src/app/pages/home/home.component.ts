import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdsService } from '../../core/ads.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card">
      <h1>Welcome to AdMoney</h1>
      <p>Angular frontend + Node.js API with JWT cookies.</p>
      <div style="display:flex;gap:10px;">
        <a class="btn btn-primary" routerLink="/signup">Create Account</a>
        <a class="btn btn-secondary" routerLink="/login">Login</a>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  constructor(private ads: AdsService) {}

  ngOnInit(): void {
    this.ads.enableAutoAds();
  }
}
