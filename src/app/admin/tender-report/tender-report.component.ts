import 'ag-grid-community/styles/ag-theme-quartz.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AgGridModule } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  ValueFormatterParams
} from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

import { AdminService } from '../../services/AdminService';
import { ObjOfferParticipant } from '../../models/ObjOfferParticipant';
import { ObjOffersReport } from '../../models/ObjOffersReport';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { PageResponse } from '../../models/ApiResponses';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-admin-tender-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
    NzSkeletonModule,
    NzEmptyModule,
    NzTypographyModule,
    AgGridModule
  ],
  templateUrl: './tender-report.component.html',
  styleUrls: ['./tender-report.component.css']
})
export class AdminTenderReportComponent implements OnInit {
  filterForm: FormGroup;
  tenders: ObjTenderOffers[] = [];
  report: ObjOffersReport | null = null;
  loadingTenders = false;
  loadingReport = false;
  participantsRowData: ObjOfferParticipant[] = [];

  readonly defaultColumnDefs: ColDef<ObjOfferParticipant> = {
    flex: 1,
    minWidth: 150,
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    suppressHeaderMenuButton: true
  };

  readonly columnDefs: ColDef<ObjOfferParticipant>[] = [
    {
      headerName: 'شناسه پذیرش',
      field: 'OfferId',
      maxWidth: 130,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'نام کاربر',
      valueGetter: (params) => params.data?.Username ?? (params.data?.UserId ? `پیمانکار ${params.data.UserId}` : ''),
      filter: 'agTextColumnFilter',
      minWidth: 220
    },
    {
      headerName: 'مبلغ پیشنهاد',
      field: 'PriceOffer',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'تاریخ ثبت پیشنهاد',
      field: 'Date',
      filter: 'agDateColumnFilter',
      minWidth: 190,
      valueFormatter: (params: ValueFormatterParams) => this.dateFormatter(params)
    }
  ];

  private gridApi: GridApi<ObjOfferParticipant> | null = null;
  private requestedTenderId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private message: NzMessageService,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      TenderId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tenderId = Number(params.get('tenderId'));
      this.requestedTenderId = Number.isFinite(tenderId) && tenderId > 0 ? tenderId : null;
      this.tryApplyRequestedTender();
    });

    this.loadTenders();
  }

  loadTenders(): void {
    this.loadingTenders = true;
    this.adminService.getTenderOffers(200, 1, 'Id', 'descend', true).subscribe({
      next: (resp: PageResponse<ObjTenderOffers>) => {
        this.loadingTenders = false;
        if (resp.IsSuccess && resp.Result) {
          this.tenders = resp.Result.Records;
          this.tryApplyRequestedTender();
          if (!this.filterForm.get('TenderId')?.value && this.tenders.length) {
            this.filterForm.patchValue({ TenderId: this.tenders[0].Id });
            this.loadReport();
          }
        } else {
          this.tenders = [];
        }
      },
      error: () => {
        this.loadingTenders = false;
        this.tenders = [];
      }
    });
  }

  loadReport(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    const tenderId = this.filterForm.get('TenderId')?.value as number;
    if (!tenderId) {
      return;
    }

    this.loadingReport = true;
    this.report = null;
    this.participantsRowData = [];
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', []);
      this.gridApi.showLoadingOverlay();
    }

    this.adminService.getTenderReport(tenderId).subscribe({
      next: (resp) => {
        this.loadingReport = false;
        if (resp.IsSuccess) {
          this.report = resp.Result;
          this.participantsRowData = this.participants.slice();
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', this.participantsRowData);
            if (!this.participantsRowData.length) {
              this.gridApi.showNoRowsOverlay();
            } else {
              this.gridApi.hideOverlay();
            }
          }
        } else {
          this.report = null;
          this.participantsRowData = [];
          this.message.error(resp.Message || 'بازیابی گزارش با مشکل مواجه شد.');
          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', []);
            this.gridApi.showNoRowsOverlay();
          }
        }
      },
      error: () => {
        this.loadingReport = false;
        this.report = null;
        this.participantsRowData = [];
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', []);
          this.gridApi.showNoRowsOverlay();
        }
      }
    });
  }

  get participants(): ObjOfferParticipant[] {
    return this.report?.Participants ?? [];
  }

  onGridReady(event: GridReadyEvent<ObjOfferParticipant>): void {
    this.gridApi = event.api;
    event.api.setGridOption('domLayout', 'autoHeight');
    if (!this.participantsRowData.length) {
      event.api.showNoRowsOverlay();
    }
  }

  private tryApplyRequestedTender(): void {
    if (!this.requestedTenderId || !this.tenders.length) {
      return;
    }

    const match = this.tenders.find((t) => t.Id === this.requestedTenderId);
    if (match) {
      this.filterForm.patchValue({ TenderId: match.Id });
      this.requestedTenderId = null;
      this.loadReport();
    }
  }

  private numberFormatter(params: ValueFormatterParams): string {
    const value = params.value;
    return value != null && value !== '' ? Number(value).toLocaleString('fa-IR') : '';
  }

  private dateFormatter(params: ValueFormatterParams): string {
    if (!params.value) {
      return '';
    }
    const date = params.value instanceof Date ? params.value : new Date(params.value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('fa-IR');
  }
}
