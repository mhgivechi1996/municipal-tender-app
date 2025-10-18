import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AgGridModule } from 'ag-grid-angular';
import {
  AllCommunityModule,
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  ValueFormatterParams,
  ValueGetterParams
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { PageResponse } from '../../models/ApiResponses';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { AdminService } from '../../services/AdminService';
import { TenderSignalService } from '../../services/TenderSignalService';

@Component({
  selector: 'app-admin-tender-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgZorroAntdModule, AgGridModule],
  templateUrl: './tender-offers.component.html',
  styleUrl: './tender-offers.component.css'
})
export class AdminTenderOffersComponent implements OnInit {
  readonly defaultColumnDefs: ColDef = {
    flex: 1,
    minWidth: 140,
    sortable: true,
    filter: true,
    resizable: true
  };

  readonly columnDefs: ColDef[] = [
    { headerName: 'شناسه', field: 'Id', maxWidth: 120 },
    { headerName: 'عنوان', field: 'Title' },
    { headerName: 'توضیحات', field: 'Description' },
    {
      headerName: 'تاریخ شروع',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) =>
        params.data?.BeginDate ? new Date(params.data.BeginDate).toISOString().split('T')[0] : ''
    },
    {
      headerName: 'تاریخ پایان',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) =>
        params.data?.EndDate ? new Date(params.data.EndDate).toISOString().split('T')[0] : ''
    },
    {
      headerName: 'حداقل قیمت',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) => params.data?.FromPrice ?? null,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value != null ? Number(params.value).toLocaleString('fa-IR') : ''
    },
    {
      headerName: 'حداکثر قیمت',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) => params.data?.ToPrice ?? null,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value != null ? Number(params.value).toLocaleString('fa-IR') : ''
    },
    {
      headerName: 'کمترین قیمت پیشنهادی',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) => params.data?.Report?.MinPriceOffer ?? null,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value != null ? Number(params.value).toLocaleString('fa-IR') : ''
    },
    {
      headerName: 'تعداد شرکت‌کنندگان',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) => params.data?.Report?.UsersCount ?? null,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value != null ? Number(params.value).toLocaleString('fa-IR') : ''
    },
    {
      headerName: 'عملیات',
      field: 'actions',
      sortable: false,
      filter: false,
      menuTabs: [],
      suppressHeaderContextMenu: true,
      minWidth: 240,
      cellRenderer: () => `
        <div class="grid-actions">
          <button type="button" class="action-button action-edit">ویرایش</button>
          <button type="button" class="action-button action-report">گزارش</button>
          <button type="button" class="action-button action-delete">حذف</button>
        </div>
      `
    }
  ];

  rowData: ObjTenderOffers[] = [];
  loading = false;
  includeExpired = true;

  private gridApi: GridApi | null = null;
  private readonly fetchPageSize = 500;

  isEditModalVisible = false;

  row: ObjTenderOffers = new ObjTenderOffers();
  validateForm: FormGroup = this.fb.group({
    Title: ['', [Validators.required, Validators.maxLength(100)]],
    Description: ['', [Validators.required]],
    BeginDate: [null, [Validators.required]],
    EndDate: [null, [Validators.required]],
    FromPrice: [null, [Validators.required, Validators.min(0)]],
    ToPrice: [null, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private message: NzMessageService,
    private router: Router,
    private tenderSignalService: TenderSignalService
  ) {}

  ngOnInit(): void {
    this.loadTenderOffers();
  }

  onGridReady(event: GridReadyEvent): void {
    const gridApi = event.api;
    gridApi.setGridOption('domLayout', 'autoHeight');
    this.gridApi = gridApi;
    if (this.loading) {
      gridApi.showLoadingOverlay();
    } else if (this.rowData.length === 0) {
      gridApi.showNoRowsOverlay();
    } else {
      gridApi.hideOverlay();
    }
  }

  onCellClicked(event: CellClickedEvent): void {
    if (event.colDef.field !== 'actions' || !event.data) {
      return;
    }

    const domEvent = event.event;
    if (!domEvent) {
      return;
    }

    const target = domEvent.target instanceof HTMLElement ? domEvent.target : null;
    const actionButton = target?.closest('.action-button') as HTMLElement | null;
    if (!actionButton) {
      return;
    }

    domEvent.preventDefault();
    domEvent.stopPropagation();
    if (actionButton.classList.contains('action-edit')) {
      this.editRow(event.data);
    } else if (actionButton.classList.contains('action-report')) {
      this.openReport(event.data.Id);
    } else if (actionButton.classList.contains('action-delete')) {
      if (confirm('آیا از حذف این مورد اطمینان دارید؟')) {
        this.deleteRow(event.data.Id);
      }
    }
  }

  toggleIncludeExpired(value: boolean): void {
    this.includeExpired = value;
    this.loadTenderOffers();
    this.refreshCounts();
  }

  private loadTenderOffers(): void {
    this.loading = true;
    if (this.gridApi) {
      this.gridApi.showLoadingOverlay();
    }

    this.adminService
      .getTenderOffers(this.fetchPageSize, 1, null, null, this.includeExpired)
      .subscribe({
        next: (resp: PageResponse<ObjTenderOffers>) => {
          this.rowData = resp?.Result?.Records ?? [];
          this.loading = false;
          if (this.gridApi) {
            if (this.rowData.length === 0) {
              this.gridApi.showNoRowsOverlay();
            } else {
              this.gridApi.hideOverlay();
            }
          }
        },
        error: () => {
          this.rowData = [];
          this.loading = false;
          this.message.error('بارگذاری فهرست مناقصه‌ها با خطا روبه‌رو شد');
          if (this.gridApi) {
            this.gridApi.showNoRowsOverlay();
          }
        }
      });
  }

  addRow(): void {
    this.row = new ObjTenderOffers();
    this.validateForm.reset({
      Title: '',
      Description: '',
      BeginDate: null,
      EndDate: null,
      FromPrice: null,
      ToPrice: null
    });
    this.isEditModalVisible = true;
  }

  editRow(data: ObjTenderOffers): void {
    this.row = data;
    this.validateForm.setValue({
      Title: data.Title,
      Description: data.Description,
      BeginDate: data.BeginDate ? new Date(data.BeginDate) : null,
      EndDate: data.EndDate ? new Date(data.EndDate) : null,
      FromPrice: data.FromPrice,
      ToPrice: data.ToPrice
    });
    this.isEditModalVisible = true;
  }

  submitForm(): void {
    if (this.validateForm.invalid) {
      Object.values(this.validateForm.controls).forEach((control) => (control as FormControl).markAsDirty());
      return;
    }

    const formValue = this.validateForm.getRawValue();
    const beginDate = formValue['BeginDate'] as Date | null;
    const endDate = formValue['EndDate'] as Date | null;
    const fromPrice = formValue['FromPrice'] as number | null;
    const toPrice = formValue['ToPrice'] as number | null;

    if (!beginDate || !endDate) {
      this.message.error('ورود تاریخ شروع و پایان الزامی است.');
      return;
    }

    if (endDate < beginDate) {
      this.message.error('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.');
      return;
    }

    if ((fromPrice ?? 0) > (toPrice ?? 0)) {
      this.message.error('حداقل قیمت نمی‌تواند بزرگ‌تر از حداکثر قیمت باشد.');
      return;
    }

    this.row.Title = formValue['Title'] ?? '';
    this.row.Description = formValue['Description'] ?? '';
    this.row.BeginDate = beginDate;
    this.row.EndDate = endDate;
    this.row.FromPrice = fromPrice ?? 0;
    this.row.ToPrice = toPrice ?? 0;

    const isNew = this.row.Id === 0;
    const request$ = isNew
      ? this.adminService.createTenderOffer(this.row)
      : this.adminService.updateTenderOffer(this.row);

    request$.subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.isEditModalVisible = false;
          this.loadTenderOffers();
          this.refreshCounts();
        }
      }
    });
  }

  deleteRow(id: number): void {
    this.adminService.deleteTenderOffer(id).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.loadTenderOffers();
          this.refreshCounts();
        }
      }
    });
  }

  openReport(tenderId: number): void {
    this.router.navigate(['/admin/tender-report'], {
      queryParams: { tenderId }
    });
  }

  private refreshCounts(): void {
    this.adminService.getTenderCounts().subscribe({
      next: (counts) => this.tenderSignalService.updateCounts(counts),
      error: () => {
        // silent fail
      }
    });
  }
}

