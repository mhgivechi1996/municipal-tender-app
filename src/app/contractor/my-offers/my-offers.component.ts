
import 'ag-grid-community/styles/ag-grid.css';
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
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { ContractorService } from '../../services/ContractorService';
import { ObjOffers } from '../../models/ObjOffers';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { PageResponse } from '../../models/ApiResponses';
import { GridActionButtonsRendererComponent } from '../../shared/grid-action-buttons/grid-action-buttons-renderer.component';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-contractor-my-offers',
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
  templateUrl: './my-offers.component.html',
  styleUrl: './my-offers.component.css'
})
export class ContractorMyOffersComponent implements OnInit {
  total = 0;
  list: ObjOffers[] = [];
  rowData: ObjOffers[] = [];
  loading = false;
  pageSize = 10;
  pageIndex = 1;
  readonly frameworkComponents = {
    actionButtonsRenderer: GridActionButtonsRendererComponent
  };

  isEditModalVisible = false;
  selectedOffer: ObjOffers | null = null;
  validateForm: FormGroup = this.fb.group({
    PriceOffer: [null, [Validators.required, Validators.min(1)]]
  });

  private gridApi: GridApi<ObjOffers> | null = null;

  readonly defaultColumnDefs: ColDef<ObjOffers> = {
    flex: 1,
    minWidth: 140,
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    suppressHeaderMenuButton: true
  };

  readonly columnDefs: ColDef<ObjOffers>[] = [
    {
      headerName: 'شماره پیشنهاد',
      field: 'Id',
      maxWidth: 130,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'عنوان مناقصه',
      headerTooltip: 'عنوان مناقصه',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.Title ?? '',
      filter: 'agTextColumnFilter',
      minWidth: 220
    },
    {
      headerName: 'تاریخ شروع',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.BeginDate ?? null,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.dateFormatter(params)
    },
    {
      headerName: 'تاریخ پایان',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.EndDate ?? null,
      filter: 'agDateColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.dateFormatter(params)
    },
    {
      headerName: 'حداقل قیمت',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.FromPrice ?? null,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'حداکثر قیمت',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.ToPrice ?? null,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'کمترین پیشنهاد ثبت‌شده',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.Report?.MinPriceOffer ?? null,
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'تعداد شرکت‌کننده‌ها',
      valueGetter: (params: ValueGetterParams<ObjOffers>) => params.data?.TenderOffer?.Report?.UsersCount ?? null,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'پیشنهاد شما',
      field: 'PriceOffer',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.numberFormatter(params)
    },
    {
      headerName: 'تاریخ ثبت',
      field: 'Date',
      filter: 'agDateColumnFilter',
      valueFormatter: (params: ValueFormatterParams) => this.dateFormatter(params)
    },
    {
      headerName: 'عملیات',
      colId: 'actions',
      sortable: false,
      filter: false,
      floatingFilter: false,
      menuTabs: [],
      suppressHeaderContextMenu: true,
      minWidth: 240,
      cellRenderer: 'actionButtonsRenderer',
      cellRendererParams: {
        buttons: [
          {
            icon: 'edit',
            tooltip: 'ویرایش پیشنهاد',
            ariaLabel: 'ویرایش پیشنهاد',
            nzType: 'primary',
            onClick: (record: ObjOffers | null) => {
              if (record) {
                this.editRow(record);
              }
            }
          },
          {
            icon: 'delete',
            tooltip: 'حذف پیشنهاد',
            ariaLabel: 'حذف پیشنهاد',
            nzDanger: true,
            onClick: (record: ObjOffers | null) => {
              if (record) {
                this.confirmDelete(record.Id);
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
    private message: NzMessageService,
    private modal: NzModalService
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

    this.contractorService
      .getMyOffers(pageSize, pageIndex, sortField, sortOrder)
      .subscribe({
        next: (resp: PageResponse<ObjOffers>) => {
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

  onGridReady(event: GridReadyEvent<ObjOffers>): void {
    this.gridApi = event.api;
    event.api.setGridOption('domLayout', 'autoHeight');
    if (!this.rowData.length) {
      event.api.showNoRowsOverlay();
    }
  }

  onCellClicked(event: CellClickedEvent<ObjOffers>): void {
    if ((event.colDef.colId ?? event.colDef.field) !== 'actions' || !event.data) {
      return;
    }

    const target = event.event?.target instanceof HTMLElement ? event.event.target : null;
    const button = target?.closest('button');
    if (!button) {
      return;
    }

    event.event?.preventDefault();
    event.event?.stopPropagation();
    if (button.classList.contains('action-edit')) {
      this.editRow(event.data);
    } else if (button.classList.contains('action-delete')) {
      this.confirmDelete(event.data.Id);
    }
  }

  onPageIndexChange(pageIndex: number): void {
    if (pageIndex !== this.pageIndex) {
      this.loadDataFromServer(pageIndex, this.pageSize, null, null);
    }
  }

  onPageSizeChange(pageSize: number): void {
    this.loadDataFromServer(1, pageSize, null, null);
  }

  editRow(offer: ObjOffers): void {
    this.selectedOffer = offer;
    const tender: ObjTenderOffers | null = offer.TenderOffer;
    const priceControl = this.validateForm.get('PriceOffer');
    priceControl?.setValidators([
      Validators.required,
      Validators.min(tender?.FromPrice ?? 1),
      Validators.max(tender?.ToPrice ?? Number.MAX_SAFE_INTEGER)
    ]);
    priceControl?.reset(offer.PriceOffer ?? tender?.FromPrice ?? null);
    priceControl?.markAsPristine();
    priceControl?.updateValueAndValidity({ emitEvent: false });
    this.isEditModalVisible = true;
  }

  submitForm(): void {
    if (!this.selectedOffer) {
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

    this.contractorService.updateOffer(this.selectedOffer.Id, price).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.isEditModalVisible = false;
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
        }
      }
    });
  }

  private confirmDelete(id: number): void {
    this.modal.confirm({
      nzTitle: 'حذف پیشنهاد',
      nzContent: 'آیا از حذف این پیشنهاد مطمئن هستید؟',
      nzOkText: 'بله',
      nzCancelText: 'خیر',
      nzOnOk: () => this.deleteRow(id)
    });
  }

  private deleteRow(id: number): void {
    this.contractorService.deleteOffer(id).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
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
    return date.toLocaleString('fa-IR');
  }
}
