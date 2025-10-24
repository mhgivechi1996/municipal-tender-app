import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdvancedGridComponent } from '../../shared/ag-grid/advanced-grid.component';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  IDateFilterParams,
  INumberFilterParams,
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
import { GridActionButtonsRendererComponent } from '../../shared/grid-action-buttons/grid-action-buttons-renderer.component';

@Component({
  selector: 'app-admin-tender-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    AdvancedGridComponent,
    GridActionButtonsRendererComponent
  ],
  templateUrl: './tender-offers.component.html',
  styleUrl: './tender-offers.component.css'
})
export class AdminTenderOffersComponent implements OnInit {
  filtersExpanded = false;
  readonly numberFormatter = (params: ValueFormatterParams): string => {
    const value = params.value;
    return value != null && value !== ''
      ? Number(value).toLocaleString('fa-IR')
      : '';
  };

  readonly dateFormatter = (params: ValueFormatterParams): string => {
    if (!params.value) {
      return '';
    }
    const date =
      params.value instanceof Date ? params.value : new Date(params.value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('fa-IR');
  };

  private readonly dateComparator = (
    filterLocalDateAtMidnight: Date,
    cellValue?: Date | string | null
  ): number => {
    if (!cellValue) {
      return -1;
    }
    const cellDate =
      cellValue instanceof Date ? cellValue : new Date(cellValue);
    if (Number.isNaN(cellDate.getTime())) {
      return -1;
    }
    const cellTime = new Date(
      cellDate.getFullYear(),
      cellDate.getMonth(),
      cellDate.getDate()
    ).getTime();
    const filterTime = filterLocalDateAtMidnight.getTime();
    if (cellTime === filterTime) {
      return 0;
    }
    return cellTime < filterTime ? -1 : 1;
  };

  readonly dateFilterParams: IDateFilterParams = {
    comparator: this.dateComparator,
    browserDatePicker: true,
    buttons: ['clear']
  };

  readonly numberFilterParams: INumberFilterParams = {
    buttons: ['clear']
  };

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
      filterParams: this.dateFilterParams,
      minWidth: 170,
      valueFormatter: this.dateFormatter
    },
    {
      headerName: 'تاریخ پایان',
      field: 'EndDate',
      filter: 'agDateColumnFilter',
      filterParams: this.dateFilterParams,
      minWidth: 170,
      valueFormatter: this.dateFormatter
    },
    {
      headerName: 'حداقل قیمت',
      field: 'FromPrice',
      filter: 'agNumberColumnFilter',
      filterParams: this.numberFilterParams,
      minWidth: 160,
      valueFormatter: this.numberFormatter
    },
    {
      headerName: 'حداکثر قیمت',
      field: 'ToPrice',
      filter: 'agNumberColumnFilter',
      filterParams: this.numberFilterParams,
      minWidth: 160,
      valueFormatter: this.numberFormatter
    },
    {
      headerName: 'کمترین قیمت پیشنهادی',
      colId: 'MinPriceOffer',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) =>
        params.data?.Report?.MinPriceOffer ?? null,
      filter: 'agNumberColumnFilter',
      filterParams: this.numberFilterParams,
      minWidth: 200,
      valueFormatter: this.numberFormatter
    },
    {
      headerName: 'تعداد شرکت‌کنندگان',
      colId: 'UsersCount',
      valueGetter: (params: ValueGetterParams<ObjTenderOffers>) =>
        params.data?.Report?.UsersCount ?? null,
      filter: 'agNumberColumnFilter',
      filterParams: this.numberFilterParams,
      minWidth: 190,
      valueFormatter: this.numberFormatter
    },
    {
      headerName: 'عملیات',
      colId: 'actions',
      sortable: false,
      filter: false,
      floatingFilter: false,
      menuTabs: [],
      suppressHeaderContextMenu: true,
      minWidth: 260,
      cellRenderer: GridActionButtonsRendererComponent,
      cellRendererParams: {
        buttons: [
          {
            icon: 'edit',
            tooltip: 'ویرایش مناقصه',
            ariaLabel: 'ویرایش',
            nzType: 'primary',
            onClick: (record: ObjTenderOffers | null) => {
              if (record) {
                this.editRow(record);
              }
            }
          },
          {
            icon: 'file-text',
            tooltip: 'گزارش مناقصه',
            ariaLabel: 'گزارش',
            nzType: 'default',
            onClick: (record: ObjTenderOffers | null) => {
              if (record) {
                this.openReport(record.Id);
              }
            }
          },
          {
            icon: 'delete',
            tooltip: 'حذف مناقصه',
            ariaLabel: 'حذف',
            nzDanger: true,
            onClick: (record: ObjTenderOffers | null) => {
              if (record && confirm('آیا از حذف این مورد اطمینان دارید؟')) {
                this.deleteRow(record.Id);
              }
            }
          }
        ]
      }
    }
  ];

  rowData: ObjTenderOffers[] = [];
  loading = false;
  includeExpired = true;

  private gridApi: GridApi<ObjTenderOffers> | null = null;
  private readonly fetchPageSize = 500;
  private readonly maxFutureDateForFilter = '2100-12-31';
  private readonly oneBillion = 1_000_000_000;
  private readonly fiveBillion = 5_000_000_000;

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

  onToggleFilters(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.filtersExpanded = !this.filtersExpanded;
  }

  onGridReady(event: GridReadyEvent<ObjTenderOffers>): void {
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

  clearAllFilters(): void {
    if (!this.gridApi) {
      return;
    }
    this.gridApi.setFilterModel(null);
    this.gridApi.onFilterChanged();
  }

  filterActiveTenders(): void {
    const today = new Date();
    this.setColumnFilterModel('EndDate', {
      type: 'inRange',
      dateFrom: this.formatDateForFilter(today),
      dateTo: this.maxFutureDateForFilter
    });
  }

  filterEndingSoon(): void {
    const today = new Date();
    const inSevenDays = new Date(today);
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    this.setColumnFilterModel('EndDate', {
      type: 'inRange',
      dateFrom: this.formatDateForFilter(today),
      dateTo: this.formatDateForFilter(inSevenDays)
    });
  }

  filterRecentlyStarted(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    this.setColumnFilterModel('BeginDate', {
      type: 'greaterThan',
      dateFrom: this.formatDateForFilter(sevenDaysAgo)
    });
  }

  clearDateFilters(): void {
    this.setColumnFilterModel('BeginDate', null);
    this.setColumnFilterModel('EndDate', null);
  }

  filterHighBudget(): void {
    this.setColumnFilterModel('ToPrice', {
      type: 'greaterThanOrEqual',
      filter: this.fiveBillion
    });
  }

  filterMidBudget(): void {
    this.setColumnFilterModel('ToPrice', {
      type: 'inRange',
      filter: this.oneBillion,
      filterTo: this.fiveBillion
    });
  }

  filterLowBudget(): void {
    this.setColumnFilterModel('ToPrice', {
      type: 'lessThan',
      filter: this.oneBillion
    });
  }

  clearBudgetFilters(): void {
    this.setColumnFilterModel('FromPrice', null);
    this.setColumnFilterModel('ToPrice', null);
    this.setColumnFilterModel('MinPriceOffer', null);
  }

  filterHasParticipants(): void {
    this.setColumnFilterModel('UsersCount', {
      type: 'greaterThan',
      filter: 0
    });
  }

  filterNoParticipants(): void {
    this.setColumnFilterModel('UsersCount', {
      type: 'equals',
      filter: 0
    });
  }

  clearParticipationFilter(): void {
    this.setColumnFilterModel('UsersCount', null);
  }

  private setColumnFilterModel(columnKey: string, model: any | null): void {
    if (!this.gridApi) {
      return;
    }
    void this.gridApi
      .setColumnFilterModel(columnKey, model)
      .then(() => this.gridApi?.onFilterChanged());
  }

  private formatDateForFilter(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toggleIncludeExpired(value: boolean): void {
    this.includeExpired = value;
    this.loadTenderOffers();
    this.refreshCounts();
  }

  loadTenderOffers(): void {
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

