import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgZorroAntdModule } from '../../../Modules/ng-zorro-antd.module';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { map } from 'rxjs/operators';


import { AuthService } from '../../services/AuthService';
import { AdminService } from '../../services/AdminService';

import { ObjTenderOffers } from '../../models/ObjTenderOffers';

@Component({
  selector: 'app-admin-tender-offers',
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
export class AdminTenderOffersComponent implements OnInit {
  total = 1;
  list: ObjTenderOffers[] = [];
  loading = true;
  pageSize = 10;
  pageIndex = 1;
  filter = [];

  isEditModalVisible = false;
  row: ObjTenderOffers = new ObjTenderOffers();
  validateForm: FormGroup<{
    Title: FormControl<string>;
    Description: FormControl<string>;
    BeginDate: FormControl<Date>;
    EndDate: FormControl<Date>;
    FromPrice: FormControl<number>;
    ToPrice: FormControl<number>;
  }> = this.fb.group({
    Title: this.fb.control<string>(""),
    Description: this.fb.control<string>(""),
    BeginDate: this.fb.control<Date>(new Date()),
    EndDate: this.fb.control<Date>(new Date()),
    FromPrice: this.fb.control<number>(0),
    ToPrice: this.fb.control<number>(0)
  });



  loadDataFromServer(
    pageIndex: number,
    pageSize: number,
    sortField: string | null,
    sortOrder: string | null,
    filter: Array<{ key: string; value: string[] }>
  ): void {
    this.loading = true;

    this.adminService.GetList(pageSize, pageIndex, sortField, sortOrder, filter).subscribe(
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

  addRow(): void {
    this.row = new ObjTenderOffers();
    this.isEditModalVisible = true;
  }


  editRow(data: ObjTenderOffers): void {
    this.row = data;
    this.isEditModalVisible = true;

    this.validateForm.controls.Title.setValue(this.row.Title);
    this.validateForm.controls.Description.setValue(this.row.Description);

    this.validateForm.controls.BeginDate.setValue(this.row.BeginDate);
    this.validateForm.controls.EndDate.setValue(this.row.EndDate);

    this.validateForm.controls.FromPrice.setValue(this.row.FromPrice);
    this.validateForm.controls.ToPrice.setValue(this.row.ToPrice);

  }

  submitForm(): void {

    //console.log(this.validateForm.status, this.validateForm.value);

    // stop here if form is invalid
    if (this.validateForm.invalid) {
      return;
    }


    this.row.Title = this.validateForm.controls.Title.value;
    this.row.Description = this.validateForm.controls.Description.value;
    this.row.BeginDate = this.validateForm.controls.BeginDate.value;
    this.row.EndDate = this.validateForm.controls.EndDate.value;
    this.row.FromPrice = this.validateForm.controls.FromPrice.value;
    this.row.ToPrice = this.validateForm.controls.ToPrice.value;

    if (this.row.Id == 0)
      this.adminService.Add(this.row);
    else
      this.adminService.Update(this.row);

    this.isEditModalVisible = false;
    this.loadDataFromServer(this.pageIndex, this.pageSize, null, null, []);
  }

  deleteRow(id: number): void {
    this.adminService.Remove(id);
    this.loadDataFromServer(this.pageIndex, this.pageSize, null, null, []);
  }



  constructor(
    private fb: NonNullableFormBuilder,
    private adminService: AdminService) { }

  ngOnInit(): void {
    //this.loadDataFromServer(this.pageIndex, this.pageSize, null, null, []);
  }
}
