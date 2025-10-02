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
  selector: 'app-contractor-my-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule
  ],
  templateUrl: './my-offers.component.html',
  styleUrl: './my-offers.component.css'
})
export class ContractorMyOffersComponent implements OnInit {
  total = 1;
  list: ObjOffers[] = [];
  loading = true;
  pageSize = 10;
  pageIndex = 1;
  filter = [];

  isEditModalVisible = false;
  row: ObjOffers = new ObjOffers();
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

    this.contractorService.GetListMyOffers(pageSize, pageIndex, sortField, sortOrder, filter).subscribe(
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


  editRow(data: ObjOffers): void {
    this.row = data;
    this.isEditModalVisible = true;

    this.validateForm.controls.PriceOffer.setValue(this.row.PriceOffer);
  }

  submitForm(): void {

    // stop here if form is invalid
    if (this.validateForm.invalid) {
      return;
    }

    this.row.PriceOffer = this.validateForm.controls.PriceOffer.value;

    this.contractorService.Update(this.row);

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
