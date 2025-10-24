import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvancedGridComponent } from './ag-grid/advanced-grid.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdvancedGridComponent
  ],
  exports: [
    AdvancedGridComponent 
  ]
})
export class SharedModule {}
