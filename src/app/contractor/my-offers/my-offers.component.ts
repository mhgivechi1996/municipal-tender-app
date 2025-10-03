import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzMessageService } from 'ng-zorro-antd/message';

import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { ContractorService } from '../../services/ContractorService';
import { ObjOffers } from '../../models/ObjOffers';
import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { PageResponse } from '../../models/ApiResponses';

@Component({
  selector: 'app-contractor-my-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgZorroAntdModule],
  templateUrl: './my-offers.component.html',
  styleUrl: './my-offers.component.css'
})
export class ContractorMyOffersComponent implements OnInit {
  total = 0;
  list: ObjOffers[] = [];
  loading = false;
  pageSize = 10;
  pageIndex = 1;

  isEditModalVisible = false;
  selectedOffer: ObjOffers | null = null;
  validateForm: FormGroup = this.fb.group({
    PriceOffer: [null, [Validators.required, Validators.min(1)]]
  });

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

    this.contractorService
      .getMyOffers(pageSize, pageIndex, sortField, sortOrder)
      .subscribe({
        next: (resp: PageResponse<ObjOffers>) => {
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
      this.message.error('لطفاً مبلغ پیشنهادی را وارد کنید.');
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

  deleteRow(id: number): void {
    this.contractorService.deleteOffer(id).subscribe({
      next: (resp) => {
        if (resp?.IsSuccess) {
          this.loadDataFromServer(this.pageIndex, this.pageSize, null, null);
        }
      }
    });
  }
}

