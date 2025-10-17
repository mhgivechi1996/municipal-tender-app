import { CommonModule } from '@angular/common';
import { Component, EffectRef, OnDestroy, OnInit, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTableQueryParams } from 'ng-zorro-antd/table';

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { PageResponse } from '../../models/ApiResponses';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { ContractorService } from '../../services/ContractorService';
import { TenderSignalService } from '../../services/TenderSignalService';

@Component({
  selector: 'app-contractor-tender-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgZorroAntdModule],
  templateUrl: './tender-offers.component.html',
  styleUrl: './tender-offers.component.css'
})
export class ContractorTenderOffersComponent implements OnInit, OnDestroy {
  total = 0;
  list: ObjTenderOffers[] = [];
  loading = false;
  pageSize = 10;
  pageIndex = 1;
  private lastSortField: string | null = null;
  private lastSortOrder: string | null = null;
  private refreshEffect?: EffectRef;

  isOfferModalVisible = false;
  selectedTender: ObjTenderOffers | null = null;
  validateForm: FormGroup = this.fb.group({
    PriceOffer: [null, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private contractorService: ContractorService,
    private message: NzMessageService,
    private tenderSignalService: TenderSignalService
  ) {
    this.refreshEffect = effect(() => {
      const version = this.tenderSignalService.version();
      if (version === 0) {
        return;
      }

      const title = this.tenderSignalService.latestTitle();
      this.loadDataFromServer(this.pageIndex, this.pageSize, this.lastSortField, this.lastSortOrder);
      const infoMessage = title
        ? `مناقصه "${title}" ثبت شد.`
        : 'مناقصه جدید ثبت شد.';
      this.message.info(infoMessage);
    });
  }

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
      this.message.error('ثبت قیمت پیشنهادی الزامی است.');
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

  ngOnDestroy(): void {
    this.refreshEffect?.destroy();
  }
}
