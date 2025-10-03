import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzMessageService } from 'ng-zorro-antd/message';

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { AdminService } from '../../services/AdminService';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { PageResponse } from '../../models/ApiResponses';

@Component({
  selector: 'app-admin-tender-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgZorroAntdModule],
  templateUrl: './tender-offers.component.html',
  styleUrl: './tender-offers.component.css'
})
export class AdminTenderOffersComponent implements OnInit {
  total = 0;
  list: ObjTenderOffers[] = [];
  loading = false;
  pageSize = 10;
  pageIndex = 1;
  includeExpired = true;

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
    private router: Router
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

    this.adminService
      .getTenderOffers(pageSize, pageIndex, sortField, sortOrder, this.includeExpired)
      .subscribe({
        next: (resp: PageResponse<ObjTenderOffers>) => {
          this.loading = false;
          if (resp.IsSuccess && resp.Result) {
            this.total = resp.Result.RecordsCount;
            this.list = resp.Result.Records;
          } else {
            this.total = 0;
            this.list = [];
          }
        },
        error: () => {
          this.loading = false;
          this.total = 0;
          this.list = [];
        }
      });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort } = params;
    const currentSort = sort.find((item) => item.value !== null);
    const sortField = currentSort?.key ?? null;
    const sortOrder = currentSort?.value ?? null;
    this.loadDataFromServer(pageIndex, pageSize, sortField, sortOrder);
  }

  toggleIncludeExpired(value: boolean): void {
    this.includeExpired = value;
    this.loadDataFromServer(1, this.pageSize, null, null);
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
      this.message.error('Please specify both begin and end dates.');
      return;
    }

    if (endDate < beginDate) {
      this.message.error('End date must be after the begin date.');
      return;
    }

    if ((fromPrice ?? 0) > (toPrice ?? 0)) {
      this.message.error('Maximum price must be greater than or equal to minimum price.');
      return;
    }

    this.row.Title = formValue['Title'] ?? '';
    this.row.Description = formValue['Description'] ?? '';
    this.row.BeginDate = beginDate;
    this.row.EndDate = endDate;
    this.row.FromPrice = fromPrice ?? 0;
    this.row.ToPrice = toPrice ?? 0;

    const request$ = this.row.Id === 0
      ? this.adminService.createTenderOffer(this.row)
      : this.adminService.updateTenderOffer(this.row);

    request$.subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.isEditModalVisible = false;
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
        }
      }
    });
  }

  deleteRow(id: number): void {
    this.adminService.deleteTenderOffer(id).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
        }
      }
    });
  }

  openReport(tenderId: number): void {
    this.router.navigate(['/admin/tender-report'], {
      queryParams: { tenderId }
    });
  }
}
