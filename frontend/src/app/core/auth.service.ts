import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

type User = {
  id: number;
  email: string;
  visit_count: number;
  balance: number;
  twofa_enabled?: boolean;
  created_at?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  signup(email: string, password: string): Observable<{ user: User }> {
    return this.http
      .post<{ user: User }>(
        '/api/auth/signup',
        { email, password },
        { withCredentials: true }
      )
      .pipe(tap((res) => this.userSubject.next(res.user)));
  }

  login(email: string, password: string): Observable<{ user: User }> {
    return this.http
      .post<{ user: User }>(
        '/api/auth/login',
        { email, password },
        { withCredentials: true }
      )
      .pipe(tap((res) => this.userSubject.next(res.user)));
  }

  logout(): Observable<unknown> {
    return this.http
      .post('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.userSubject.next(null)));
  }

  me(): Observable<{ user: User }> {
    return this.http
      .get<{ user: User }>('/api/auth/me', { withCredentials: true })
      .pipe(tap((res) => this.userSubject.next(res.user)));
  }
}
