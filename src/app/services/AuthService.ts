import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ObjLoginResponse } from '../models/ObjLoginResponse';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private baseUrl: string = 'https://localhost:7221/api/auth';
    private currentUserSubject: BehaviorSubject<ObjLoginResponse>;
    public currentUser: Observable<ObjLoginResponse>;

    constructor(
        private http: HttpClient,
        private message: NzMessageService
    ) 
    {
        this.currentUserSubject = new BehaviorSubject<ObjLoginResponse>(JSON.parse(localStorage.getItem('currentUser') ?? "{}"));
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): ObjLoginResponse {
        return this.currentUserSubject.value;
    }

    login(username: string | null, password: string | null) {
        return this.http.post<any>(`${this.baseUrl}/Authenticate`, { username, password })
            .pipe(map(resp => {
                // login successful if there's a jwt token in the response
                if (resp && resp.IsSuccess) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify(resp.Result));
                    this.currentUserSubject.next(resp.Result);
                }

                if (resp.IsSuccess)
                    this.message.create('success', resp.Message);
                else
                    this.message.create('error', resp.Message);

                return resp;
            }));
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(new ObjLoginResponse());
    }
}