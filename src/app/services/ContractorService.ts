import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from './AuthService';
import { ObjTenderOffers } from '../models/ObjTenderOffers';
import { ObjOffers } from '../models/ObjOffers';
import { ObjOffersReport } from '../models/ObjOffersReport';
import { ObjOfferParticipant } from '../models/ObjOfferParticipant';
import { ApiResponse, PageResponse, PageResult } from '../models/ApiResponses';

interface CreateOfferPayload {
  TenderOfferId: number;
  PriceOffer: number;
}

interface UpdateOfferPayload {
  Id: number;
  PriceOffer: number;
}

@Injectable({ providedIn: 'root' })
export class ContractorService {
  private baseUrl: string = 'https://localhost:7221/api/Contractor';

  constructor(
    private http: HttpClient,
    private message: NzMessageService,
    private authService: AuthService
  ) {}

  getTenderOffers(
    pageSize: number,
    pageNumber: number,
    sortField?: string | null,
    sortOrder?: string | null
  ): Observable<PageResponse<ObjTenderOffers>> {
    const body = {
      IncludeExpired: false,
      PageSize: pageSize,
      PageNumber: pageNumber,
      SortBy: sortField ?? 'Id',
      SortIsAsc: sortOrder === 'ascend'
    };

    return this.http
      .post<PageResponse<any>>(`${this.baseUrl}/GetListTenderOffers`, body, {
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

  getMyOffers(
    pageSize: number,
    pageNumber: number,
    sortField?: string | null,
    sortOrder?: string | null
  ): Observable<PageResponse<ObjOffers>> {
    const body = {
      PageSize: pageSize,
      PageNumber: pageNumber,
      SortBy: sortField ?? 'Id',
      SortIsAsc: sortOrder === 'ascend'
    };

    return this.http
      .post<PageResponse<any>>(`${this.baseUrl}/GetListMyOffers`, body, {
        headers: this.getHeaders()
      })
      .pipe(
        map((resp) => this.mapOfferPageResponse(resp)),
        tap((resp) => {
          if (!resp.IsSuccess) {
            this.message.error(resp.Message || 'Failed to load offers');
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  createOffer(tenderOfferId: number, price: number): Observable<ApiResponse<any>> {
    const payload: CreateOfferPayload = {
      TenderOfferId: tenderOfferId,
      PriceOffer: price
    };

    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/Add`, payload, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((resp) => this.showToast(resp, 'Offer submitted successfully.')),
        catchError((error) => this.handleError(error))
      );
  }

  updateOffer(offerId: number, price: number): Observable<ApiResponse<any>> {
    const payload: UpdateOfferPayload = {
      Id: offerId,
      PriceOffer: price
    };

    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/Update`, payload, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((resp) => this.showToast(resp, 'Offer updated successfully.')),
        catchError((error) => this.handleError(error))
      );
  }

  deleteOffer(offerId: number): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/Remove`, { Id: offerId }, {
        headers: this.getHeaders()
      })
      .pipe(
        tap((resp) => this.showToast(resp, 'Offer removed successfully.')),
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

  private mapOfferPageResponse(resp: PageResponse<any>): PageResponse<ObjOffers> {
    const result: PageResult<ObjOffers> = resp.Result
      ? {
          ...resp.Result,
          Records: (resp.Result.Records ?? []).map((item: any) => this.mapOffer(item))
        }
      : {
          PageNumber: 1,
          PageSize: 0,
          PagesCount: 0,
          RecordsCount: 0,
          Records: []
        };

    return { ...resp, Result: result } as PageResponse<ObjOffers>;
  }

  private mapOffer(dto: any): ObjOffers {
    const offer = new ObjOffers();
    offer.Id = dto?.Id ?? 0;
    offer.TenderOfferId = dto?.TenderOfferId ?? null;
    offer.UserId = dto?.UserId ?? null;
    offer.PriceOffer = dto?.PriceOffer ?? null;
    offer.Date = dto?.Date ? new Date(dto.Date) : null;
    offer.TenderOffer = dto?.TenderOffer ? this.mapTenderOffer(dto.TenderOffer) : null;
    return offer;
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
