import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableQueryParams } from 'ng-zorro-antd/table';

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { PageResponse } from '../../models/ApiResponses';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { AdminService } from '../../services/AdminService';
import { TenderSignalService } from '../../services/TenderSignalService';

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
    private router: Router,
    private tenderSignalService: TenderSignalService
  ) {}

  ngOnInit(): void {
    this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
    this.refreshCounts();
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
    this.refreshCounts();
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
      this.message.error('\u0648\u0627\u0631\u062F \u06A9\u0631\u062F\u0646 \u062A\u0627\u0631\u06CC\u062E \u0634\u0631\u0648\u0639 \u0648 \u067E\u0627\u06CC\u0627\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.');
      return;
    }

    if (endDate < beginDate) {
      this.message.error('\u062A\u0627\u0631\u06CC\u062E \u067E\u0627\u06CC\u0627\u0646 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0642\u0628\u0644 \u0627\u0632 \u062A\u0627\u0631\u06CC\u062E \u0634\u0631\u0648\u0639 \u0628\u0627\u0634\u062F.');
      return;
    }

    if ((fromPrice ?? 0) > (toPrice ?? 0)) {
      this.message.error('\u062D\u062F\u0627\u0642\u0644 \u0642\u06CC\u0645\u062A \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u062D\u062F\u0627\u06A9\u062B\u0631 \u0642\u06CC\u0645\u062A \u0628\u0627\u0634\u062F.');
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
          if (isNew) {
            this.tenderSignalService.notifyTenderCreated(this.row.Title);
          }
          this.isEditModalVisible = false;
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
          this.refreshCounts();
        }
      }
    });
  }

  deleteRow(id: number): void {
    this.adminService.deleteTenderOffer(id).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
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
    this.adminService
      .getTenderOffers(1, 1, null, null, false)
      .subscribe({
        next: (openResp) => {
          const openCount = openResp.Result?.RecordsCount ?? 0;

          this.adminService
            .getTenderOffers(1, 1, null, null, true)
            .subscribe({
              next: (allResp) => {
                const totalCount = allResp.Result?.RecordsCount ?? 0;
                const expiredCount = Math.max(totalCount - openCount, 0);
                this.tenderSignalService.updateCounts(openCount, expiredCount);
              },
              error: () => {
                const current = this.tenderSignalService.counts();
                this.tenderSignalService.updateCounts(openCount, current.expired);
              }
            });
        },
        error: () => {
          const current = this.tenderSignalService.counts();
          this.tenderSignalService.updateCounts(current.open, current.expired);
        }
      });
  }
}


