import 'ag-grid-community/styles/ag-theme-quartz.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  ValueFormatterParams,
  ValueGetterParams
} from 'ag-grid-community';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { PageResponse } from '../../models/ApiResponses';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { ContractorService } from '../../services/ContractorService';
import { GridActionButtonsRendererComponent } from '../../shared/grid-action-buttons/grid-action-buttons-renderer.component';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-contractor-tender-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    AgGridModule,
    NzPaginationModule,
    GridActionButtonsRendererComponent
  ],
  templateUrl: './tender-offers.component.html',
  styleUrl: './tender-offers.component.css'
})
export class ContractorTenderOffersComponent implements OnInit {
  total = 0;
  list: ObjTenderOffers[] = [];
  rowData: ObjTenderOffers[] = [];
  loading = false;
  pageSize = 10;
  pageIndex = 1;
  private lastSortField: string | null = null;
  private lastSortOrder: string | null = null;
  private gridApi: GridApi<ObjTenderOffers> | null = null;

  isOfferModalVisible = false;
  selectedTender: ObjTenderOffers | null = null;
  validateForm: FormGroup = this.fb.group({
    PriceOffer: [null, [Validators.required, Validators.min(1)]]
  });

  readonly defaultColumnDefs: ColDef<ObjTenderOffers> = {
    flex: 1,
    minWidth: 140,
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    suppressHeaderMenuButton: true
  };

  readonly columnDefs: ColDef<ObjTenderOffers>[] = [
    {
      headerName: 'شناسه',
      field: 'Id',
      maxWidth: 110,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'عنوان',
      field: 'Title',
      filter: 'agTextColumnFilter',
      minWidth: 220
    },
    {
      headerName: 'توضیحات',
      field: 'Description',
      filter: 'agTextColumnFilter',
      minWidth: 260
    },
    {
      headerName: 'تاریخ شروع',
      field: 'BeginDate',
      filter: 'agDateColumnFilter',
      minWidth: 170,
      valueFormatter: (params: ValueFormatterParams) => this.dateFormatter(params)
    },
    {
      headerName: 'تاریخ پایان',
      field: 'EndDate',
      filter: 'agDateColumnFilter',
      minWidth: 170,
      valueFormatter: (params: ValueFormatterParams) => this.dateFormatter(params)
    },
    {
      headerName: 'حداقل قیمت',
      field: 'FromPrice',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'حداکثر قیمت',
      field: 'ToPrice',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'کمترین پیشنهاد',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) => params.data?.Report?.MinPriceOffer ?? null,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'تعداد شرکت‌کننده‌ها',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) => params.data?.Report?.UsersCount ?? null,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'عملیات',
      colId: 'actions',
      sortable: false,
      filter: false,
      floatingFilter: false,
      menuTabs: [],
      suppressHeaderContextMenu: true,
      minWidth: 200,
      cellRenderer: GridActionButtonsRendererComponent,
      cellRendererParams: {
        buttons: [
          {
            icon: 'check',
            tooltip: 'ثبت پیشنهاد',
            ariaLabel: 'ثبت پیشنهاد',
            nzType: 'primary',
            onClick: (record: ObjTenderOffers | null) => {
              if (record) {
                this.openOfferModal(record);
              }
            }
          }
        ]
      }
    }
  ];

  constructor(
    private fb: FormBuilder,
    private contractorService: ContractorService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
  }

  loadDataFromServer(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null
  ): void {
    this.loading = true;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.lastSortField = sortField ?? this.lastSortField;
    this.lastSortOrder = sortOrder ?? this.lastSortOrder;

    this.contractorService
      .getTenderOffers(pageSize, pageIndex, this.lastSortField, this.lastSortOrder)
      .subscribe({
        next: (resp: PageResponse<ObjTenderOffers>) => {
          this.loading = false;
          if (resp.IsSuccess && resp.Result) {
            this.total = resp.Result.RecordsCount;
            this.list = resp.Result.Records;
            this.rowData = [...this.list];
            if (this.gridApi) {
              this.gridApi.setGridOption('rowData', this.rowData);
              if (!this.rowData.length) {
                this.gridApi.showNoRowsOverlay();
              } else {
                this.gridApi.hideOverlay();
              }
            }
          } else {
            this.total = 0;
            this.list = [];
            this.rowData = [];
            this.gridApi?.setGridOption('rowData', []);
            this.gridApi?.showNoRowsOverlay();
          }
        },
        error: () => {
          this.loading = false;
          this.total = 0;
          this.list = [];
          this.rowData = [];
          this.gridApi?.setGridOption('rowData', []);
          this.gridApi?.showNoRowsOverlay();
        }
      });
  }

  onGridReady(event: GridReadyEvent<ObjTenderOffers>): void {
    this.gridApi = event.api;
    event.api.setGridOption('domLayout', 'autoHeight');
    if (!this.rowData.length) {
      event.api.showNoRowsOverlay();
    }
  }

  onPageIndexChange(pageIndex: number): void {
    if (pageIndex !== this.pageIndex) {
      this.loadDataFromServer(pageIndex, this.pageSize, this.lastSortField, this.lastSortOrder);
    }
  }

  onPageSizeChange(pageSize: number): void {
    this.loadDataFromServer(1, pageSize, this.lastSortField, this.lastSortOrder);
  }

  openOfferModal(tender: ObjTenderOffers): void {
    this.selectedTender = tender;
    const priceControl = this.validateForm.get('PriceOffer');
    priceControl?.setValidators([
      Validators.required,
      Validators.min(tender.FromPrice ?? 0),
      Validators.max(tender.ToPrice ?? Number.MAX_SAFE_INTEGER)
    ]);
    priceControl?.reset(tender.FromPrice ?? null);
    priceControl?.markAsPristine();
    priceControl?.updateValueAndValidity({ emitEvent: false });
    this.isOfferModalVisible = true;
  }

  submitOffer(): void {
    if (!this.selectedTender) {
      return;
    }

    if (this.validateForm.invalid) {
      this.validateForm.markAllAsTouched();
      return;
    }

    const price = this.validateForm.get('PriceOffer')?.value as number;
    if (price == null) {
      this.message.error('ثبت مبلغ پیشنهاد ضروری است.');
      return;
    }

    this.contractorService.createOffer(this.selectedTender.Id, price).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.isOfferModalVisible = false;
          this.loadDataFromServer(this.pageIndex, this.pageSize, this.lastSortField, this.lastSortOrder);
        }
      }
    });
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
    return date.toLocaleDateString('fa-IR');
  }
}
