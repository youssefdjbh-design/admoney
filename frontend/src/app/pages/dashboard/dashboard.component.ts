import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdsService } from '../../core/ads.service';

type User = {
  id: number;
  email: string;
  visit_count: number;
  balance: number;
  twofa_enabled?: boolean;
  created_at?: string;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DecimalPipe],
  template: `
    <section class="card" *ngIf="user">
      <h2>Dashboard</h2>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Total views:</strong> {{ user.visit_count }}</p>
      <p><strong>Balance:</strong> {{ user.balance | number:'1.2-4' }}</p>
      <a routerLink="/view-ad" class="btn btn-secondary">View Ad</a>
    </section>

    <section class="card" style="margin-top:16px;" *ngIf="topUsers.length">
      <h2>Top Users</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Email</th><th>Views</th><th>Balance</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of topUsers; let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.visit_count }}</td>
            <td>{{ u.balance | number:'1.2-4' }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  topUsers: User[] = [];

  constructor(private http: HttpClient, private ads: AdsService) {}

  ngOnInit(): void {
    this.ads.enableAutoAds();
    this.http
      .get<{ user: User; topUsers: User[] }>('/api/dashboard', { withCredentials: true })
      .subscribe((res) => {
        this.user = res.user;
        this.topUsers = res.topUsers;
      });
  }
}
