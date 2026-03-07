import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf, AsyncPipe],
  template: `
    <nav class="top">
      <div class="container">
        <strong>AdMoney</strong>
        <div>
          <a routerLink="/">Home</a>
          <a routerLink="/dashboard" *ngIf="(auth.user$ | async) as user">Dashboard</a>
          <a routerLink="/view-ad" *ngIf="(auth.user$ | async) as user">View Ad</a>
          <a routerLink="/login" *ngIf="!(auth.user$ | async)">Login</a>
          <a routerLink="/signup" *ngIf="!(auth.user$ | async)">Signup</a>
          <a href="#" (click)="logout($event)" *ngIf="(auth.user$ | async) as user">Logout</a>
        </div>
      </div>
    </nav>

    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {
  constructor(public auth: AuthService, private router: Router) {
    this.auth.me().subscribe({ error: () => void 0 });
  }

  logout(event: Event): void {
    event.preventDefault();
    this.auth.logout().subscribe(() => {
      this.router.navigateByUrl('/');
    });
  }
}
