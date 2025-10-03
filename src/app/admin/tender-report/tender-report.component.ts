import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AdminService } from '../../services/AdminService';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { ObjOffersReport } from '../../models/ObjOffersReport';
import { ObjOfferParticipant } from '../../models/ObjOfferParticipant';
import { PageResponse } from '../../models/ApiResponses';

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
    NzTableModule,
    NzCardModule,
    NzSkeletonModule,
    NzEmptyModule,
    NzTypographyModule
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
    this.adminService.getTenderOffers(100, 1, 'Id', 'descend', true).subscribe({
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
    this.adminService.getTenderReport(tenderId).subscribe({
      next: (resp) => {
        this.loadingReport = false;
        if (resp.IsSuccess) {
          this.report = resp.Result;
        } else {
          this.report = null;
          this.message.error(resp.Message || 'Unable to load report');
        }
      },
      error: () => {
        this.loadingReport = false;
        this.report = null;
      }
    });
  }

  get participants(): ObjOfferParticipant[] {
    return this.report?.Participants ?? [];
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
}
