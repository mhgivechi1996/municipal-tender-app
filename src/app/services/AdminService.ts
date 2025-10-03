import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from './AuthService';
import { ObjTenderOffers } from '../models/ObjTenderOffers';
import { ObjOffersReport } from '../models/ObjOffersReport';
import { ObjOfferParticipant } from '../models/ObjOfferParticipant';
import { ApiResponse, PageResponse, PageResult } from '../models/ApiResponses';

interface CreateTenderOfferPayload {
  Title: string;
  Description: string;
  BeginDate: string;
  EndDate: string;
  FromPrice: number;
  ToPrice: number;
}

interface UpdateTenderOfferPayload extends CreateTenderOfferPayload {
  Id: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl: string = 'https://localhost:7221/api/Admin';

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private authService: AuthService
  ) {}

  getTenderOffers(
    pageSize: number,
    pageNumber: number,
    sortField?: string | null,
    sortOrder?: string | null,
    includeExpired: boolean = true
  ): Observable<PageResponse<ObjTenderOffers>> {
    const body = {
      IncludeExpired: includeExpired,
      PageSize: pageSize,
      PageNumber: pageNumber,
      SortBy: sortField ?? 'Id',
      SortIsAsc: sortOrder === 'ascend'
    };

    return this.http
      .post<PageResponse<any>>(`${this.baseUrl}/GetList`, body, {
        headers: this.getHeaders()
      })
      .pipe(
        map((resp) => this.mapTenderOfferPageResponse(resp)),
        tap((resp) => {
          if (!resp.IsSuccess) {
            this.message.error(resp.Message || 'Failed to load tenders');
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  createTenderOffer(model: ObjTenderOffers): Observable<ApiResponse<any>> {
    const payload: CreateTenderOfferPayload = {
      Title: model.Title,
      Description: model.Description,
      BeginDate: this.toIso(model.BeginDate),
      EndDate: this.toIso(model.EndDate),
      FromPrice: model.FromPrice,
      ToPrice: model.ToPrice
    };

    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/Add`, payload, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((resp) => this.showToast(resp, 'Tender created successfully.')),
        catchError((error) => this.handleError(error))
      );
  }

  updateTenderOffer(model: ObjTenderOffers): Observable<ApiResponse<any>> {
    const payload: UpdateTenderOfferPayload = {
      Id: model.Id,
      Title: model.Title,
      Description: model.Description,
      BeginDate: this.toIso(model.BeginDate),
      EndDate: this.toIso(model.EndDate),
      FromPrice: model.FromPrice,
      ToPrice: model.ToPrice
    };

    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/Update`, payload, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((resp) => this.showToast(resp, 'Tender updated successfully.')),
        catchError((error) => this.handleError(error))
      );
  }

  deleteTenderOffer(id: number): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/Remove`, { Id: id }, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((resp) => this.showToast(resp, 'Tender removed successfully.')),
        catchError((error) => this.handleError(error))
      );
  }

  getTenderReport(id: number): Observable<ApiResponse<ObjOffersReport>> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/GetReport`, { Id: id }, {
        headers: this.getHeaders()
      })
      .pipe(
        map((resp) => ({
          ...resp,
          Result: this.mapOffersReport(resp.Result)
        })),
        tap((resp) => {
          if (!resp.IsSuccess) {
            this.message.error(resp.Message || 'Failed to load tender report');
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  private mapTenderOfferPageResponse(resp: PageResponse<any>): PageResponse<ObjTenderOffers> {
    const result: PageResult<ObjTenderOffers> = resp.Result
      ? {
          ...resp.Result,
          Records: (resp.Result.Records ?? []).map((item: any) => this.mapTenderOffer(item))
        }
      : {
          PageNumber: 1,
          PageSize: 0,
          PagesCount: 0,
          RecordsCount: 0,
          Records: []
        };

    return { ...resp, Result: result } as PageResponse<ObjTenderOffers>;
  }

  private mapTenderOffer(dto: any): ObjTenderOffers {
    const tender = new ObjTenderOffers();
    tender.Id = dto?.Id ?? 0;
    tender.Title = dto?.Title ?? '';
    tender.Description = dto?.Description ?? '';
    tender.BeginDate = dto?.BeginDate ? new Date(dto.BeginDate) : null;
    tender.EndDate = dto?.EndDate ? new Date(dto.EndDate) : null;
    tender.FromPrice = dto?.FromPrice ?? 0;
    tender.ToPrice = dto?.ToPrice ?? 0;
    tender.Report = this.mapOffersReport(dto?.Report);
    return tender;
  }

  private mapOffersReport(dto: any): ObjOffersReport {
    const report = new ObjOffersReport();
    if (!dto) {
      return report;
    }

    report.UsersCount = dto.UsersCount ?? null;
    report.MinPriceOffer = dto.MinPriceOffer ?? null;
    report.Participants = (dto.Participants ?? []).map((p: any) => this.mapParticipant(p));
    report.Winner = dto.Winner ? this.mapParticipant(dto.Winner) : null;
    return report;
  }

  private mapParticipant(dto: any): ObjOfferParticipant {
    const participant = new ObjOfferParticipant();
    participant.OfferId = dto?.OfferId ?? 0;
    participant.UserId = dto?.UserId ?? null;
    participant.Username = dto?.Username ?? null;
    participant.PriceOffer = dto?.PriceOffer ?? null;
    participant.Date = dto?.Date ? new Date(dto.Date) : null;
    return participant;
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.currentUserValue?.Token;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private toIso(date: Date | null): string {
    return date ? new Date(date).toISOString() : new Date().toISOString();
  }

  private showToast(resp: ApiResponse<any>, fallback: string): void {
    if (!resp) {
      return;
    }

    if (resp.IsSuccess) {
      this.message.success(resp.Message || fallback);
    } else {
      this.message.error(resp.Message || 'Operation failed.');
    }
  }

  private handleError(error: any) {
    this.message.error('Unexpected error while communicating with the server.');
    return throwError(() => error);
  }
}
