import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginRequest } from '../data-model/login-request.model';
import { EMPTY, Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { UserContextService } from './user-context.service';
import { UserModel } from '../data-model/user.model';
import { RegisterRequest } from '../data-model/register-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  URL: string = 'https://localhost:7258/api/user/'
  private login$: Subject<LoginRequest> = new Subject();
  private tokenExpirationTimer: any;
  public beforeLogout$: Subject<void> = new Subject();

  constructor(
    protected http: HttpClient,
    protected cookieService: CookieService,
    protected userContextService: UserContextService
  ) { 
    this.login$.pipe(
      takeUntilDestroyed(),
      switchMap(data => this.loginApi(data).pipe(catchError(err => {
        this.userContextService.setUserContext(null, err);
        return EMPTY;
      }))),
      switchMap(jwt => this.decodeJwt(jwt)),
      tap({
        next: id => {
          this.userContextService.setUserContext(new UserModel(id), null);
        },  
      })
    ).subscribe();
  }

  login(loginRequest: LoginRequest) {
    this.login$.next(loginRequest);
  }

  private loginApi(loginRequest: LoginRequest): Observable<string> {
    return this.http.post(this.URL + 'login', loginRequest, {responseType: 'text'});
  }

  register(registerRequest: RegisterRequest): Observable<void> {
    return this.http.post<void>(this.URL + 'register', registerRequest);
  }

  isEmailUnique(email: string) {
    return this.http.get(this.URL + 'email_unique', {
      params: new HttpParams().set('email', email)
    });
  }

  private decodeJwt(jwt: string) {
    const decoded: any = jwtDecode(jwt);
    const expiresIn = decoded.exp * 1000;
    const expDate = new Date(expiresIn);
    const id = decoded.sub;

    this.autoLogout(expiresIn - new Date().getTime());
    this.cookieService.delete('Authorization');
    this.cookieService.set('Authorization', 'Bearer '+ jwt, expDate);

    return of(id);
  }

  private autoLogout(expirationDuration: number) {

    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  logout() {
    this.cookieService.delete('Authorization');

    if(this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;

    this.userContextService.setUserContext(null, null);
    this.beforeLogout$.next();
  }

  autoLogin() {
    return toObservable(this.userContextService.user).pipe(
      switchMap(user => {
        if(user) {
          return of(true);
        }
        let authCookie = this.cookieService.get('Authorization').slice(7);
        return this.decodeJwt(authCookie).pipe(
          tap(id => this.userContextService.setUserContext(new UserModel(id), null))
        )
      })
    )
  }
}
