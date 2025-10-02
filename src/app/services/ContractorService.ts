import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from './AuthService';
import { ObjLoginResponse } from '../models/ObjLoginResponse';
import { ObjTenderOffers } from '../models/ObjTenderOffers';
import { ObjOffers } from '../models/ObjOffers';


@Injectable({ providedIn: 'root' })
export class ContractorService {
    private baseUrl: string = 'https://localhost:7221/api/Contractor';
    private currentUser: ObjLoginResponse = new ObjLoginResponse();

    constructor(
        private http: HttpClient,
        private message: NzMessageService,
        private authService: AuthService) {
    }

    GetListTenderOffers(
        PageSize: number,
        PageNumber: number,
        sortField: string | null,
        sortOrder: string | null,
        filter: Array<{ key: string; value: string[] }>) {
        this.authService.currentUser.subscribe(x => this.currentUser = x);
        const headers = { 'Authorization': 'Bearer ' + this.currentUser.Token }

        return this.http.post<any>(this.baseUrl + '/GetListTenderOffers', { PageSize, PageNumber }, { headers })
            .pipe(map(resp => {
                if (!resp.IsSuccess)
                    this.message.create('error', resp.Message);
                return resp;
            }));
    }

    GetListMyOffers(
        PageSize: number,
        PageNumber: number,
        sortField: string | null,
        sortOrder: string | null,
        filter: Array<{ key: string; value: string[] }>) {
        this.authService.currentUser.subscribe(x => this.currentUser = x);
        const headers = { 'Authorization': 'Bearer ' + this.currentUser.Token }

        return this.http.post<any>(this.baseUrl + '/GetListMyOffers', { PageSize, PageNumber }, { headers })
            .pipe(map(resp => {
                if (!resp.IsSuccess)
                    this.message.create('error', resp.Message);
                return resp;
            }));
    }

    Get(Id: number) {
        this.authService.currentUser.subscribe(x => this.currentUser = x);
        const headers = { 'Authorization': 'Bearer ' + this.currentUser.Token }

        return this.http.post<any>(this.baseUrl + '/Get?id=' + Id, {}, { headers })
            .subscribe(resp => {

                if (resp.IsSuccess)
                    this.message.create('success', resp.Message);
                else
                    this.message.create('error', resp.Message);

                return resp;
            });
    }

    Add(item: ObjOffers) {
        this.authService.currentUser.subscribe(x => this.currentUser = x);
        const headers = { 'Authorization': 'Bearer ' + this.currentUser.Token }

        return this.http.post<any>(this.baseUrl + '/Add', item, { headers })
            .subscribe(resp => {

                if (resp.IsSuccess)
                    this.message.create('success', resp.Message);
                else
                    this.message.create('error', resp.Message);

                return resp;
            });
    }

    Update(item: ObjOffers) {
        this.authService.currentUser.subscribe(x => this.currentUser = x);
        const headers = { 'Authorization': 'Bearer ' + this.currentUser.Token }

        return this.http.post<any>(this.baseUrl + '/Update', item, { headers })
            .subscribe(resp => {

                if (resp.IsSuccess)
                    this.message.create('success', resp.Message);
                else
                    this.message.create('error', resp.Message);

                return resp;
            });
    }

    Remove(Id: number) {
        this.authService.currentUser.subscribe(x => this.currentUser = x);
        const headers = { 'Authorization': 'Bearer ' + this.currentUser.Token }

        return this.http.post<any>(this.baseUrl + '/Remove', { Id }, { headers })
            .subscribe(resp => {

                if (resp.IsSuccess)
                    this.message.create('success', resp.Message);
                else
                    this.message.create('error', resp.Message);

                return resp;
            });
    }
}