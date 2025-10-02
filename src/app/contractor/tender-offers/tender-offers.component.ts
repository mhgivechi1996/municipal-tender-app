import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { map } from 'rxjs/operators';


import { AuthService } from '../../services/AuthService';
import { ContractorService } from '../../services/ContractorService';

import { ObjTenderOffers } from '../../models/ObjTenderOffers';
import { ObjOffers } from '../../models/ObjOffers';

@Component({
  selector: 'app-contractor-tender-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule
  ],
  templateUrl: './tender-offers.component.html',
  styleUrl: './tender-offers.component.css'
})
export class ContractorTenderOffersComponent implements OnInit {
  total = 1;
  list: ObjTenderOffers[] = [];
  loading = true;
  pageSize = 10;
  pageIndex = 1;
  filter = [];

  isEditModalVisible = false;
  row: ObjTenderOffers = new ObjTenderOffers();
  validateForm: FormGroup<{
    PriceOffer: FormControl<number>;
  }> = this.fb.group({
    PriceOffer: this.fb.control<number>(0)
  });



  loadDataFromServer(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filter: Array<{ key: string; value: string[] }>
  ): void {
    this.loading = true;

    this.contractorService.GetListTenderOffers(pageSize, pageIndex, sortField, sortOrder, filter).subscribe(
      data => {
        this.loading = false;
        this.total = data.Result.RecordsCount; // mock the total data here
        this.list = data.Result.Records;
      });


  }


  onQueryParamsChange(params: NzTableQueryParams): void {
    //console.log(params);
    const { pageSize, pageIndex, sort, filter } = params;
    const currentSort = sort.find(item => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    this.loadDataFromServer(pageIndex, pageSize, sortField, sortOrder, filter);
  }

 
  addRow(data: ObjTenderOffers): void {
    this.row = data;
    this.isEditModalVisible = true;
    this.validateForm.controls.PriceOffer.setValue(0);
  }

  submitForm(): void {

    //console.log(this.validateForm.status, this.validateForm.value);

    // stop here if form is invalid
    if (this.validateForm.invalid) {
      return;
    }

    let offer = new ObjOffers();
    offer.PriceOffer = this.validateForm.controls.PriceOffer.value;
    offer.TenderOfferId = this.row.Id;
    
    this.contractorService.Add(offer);

    this.isEditModalVisible = false;

  }

  deleteRow(id: number): void {
    this.contractorService.Remove(id);
    this.loadDataFromServer(this.pageIndex, this.pageSize, null, null, []);
  }



  constructor(
    private fb: NonNullableFormBuilder,
    private contractorService: ContractorService) { }

  ngOnInit(): void {
    //this.loadDataFromServer(this.pageIndex, this.pageSize, null, null, []);
  }
}
