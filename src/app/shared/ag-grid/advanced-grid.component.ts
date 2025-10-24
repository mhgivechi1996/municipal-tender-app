import 'ag-grid-community/styles/ag-theme-quartz.css';

import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
  SideBarDef
} from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AG_GRID_LOCALE_IR } from '@ag-grid-community/locale';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-advanced-grid',
  standalone: true,
  imports: [CommonModule, AgGridModule, NzButtonModule, NzIconModule, NzToolTipModule],
  templateUrl: './advanced-grid.component.html',
  styleUrl: './advanced-grid.component.css'
})
export class AdvancedGridComponent<TData = any> implements OnChanges {
  faLocale = AG_GRID_LOCALE_IR;
  @Input() columnDefs: ColDef<TData>[] = [];
  @Input() defaultColDef: ColDef<TData> = {};
  @Input() rowData: TData[] | null = null;
  @Input() loading = false;
  @Input() enableRtl = true;
  @Input() showToolbar = true;
  @Input() showRowGroupPanel = false;
  @Input() gridClass = '';
  @Input() gridHeight = '100%';
  @Input() suppressExcelExport = false;
  @Input() exportFileName = 'grid-export';
  @Input() extraToolbarTooltip?: string;
  @Input() gridOptions: GridOptions<TData> = {};
  @Input() sideBar: SideBarDef | boolean | null = null;
  @Input() enableRangeSelection = false;

  @Output() gridReady = new EventEmitter<GridReadyEvent<TData>>();
  @Output() refreshRequested = new EventEmitter<void>();

  @ViewChild(AgGridAngular) agGrid?: AgGridAngular<TData>;

  resolvedGridOptions: GridOptions<TData> = {};

  private gridApi: GridApi<TData> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['gridOptions'] ||
      changes['defaultColDef'] ||
      changes['enableRtl'] ||
      changes['sideBar'] ||
      changes['showRowGroupPanel'] ||
      changes['enableRangeSelection']
    ) {
      this.resolvedGridOptions = this.buildGridOptions();
    }

    if ((changes['rowData'] || changes['loading']) && this.gridApi) {
      this.updateGridOverlays();
    }
  }

  onGridReady(event: GridReadyEvent<TData>): void {
    this.gridApi = event.api;
    this.gridReady.emit(event);
    this.updateGridOverlays();
  }

  handleRefreshClick(): void {
    this.refreshRequested.emit();
  }

  handleExcelExport(): void {
    if (!this.gridApi || this.suppressExcelExport) {
      return;
    }

    const safeFileName = this.exportFileName?.trim() || 'grid-export';
    this.gridApi.exportDataAsExcel({
      fileName: safeFileName.endsWith('.xlsx') ? safeFileName : `${safeFileName}.xlsx`,
      processCellCallback: (params) => (params.value ?? '') as string
    });
  }

  private buildGridOptions(): GridOptions<TData> {
    const baseOptions: GridOptions<TData> = {
      animateRows: true,
      enableRtl: this.enableRtl,
      suppressDragLeaveHidesColumns: false,
      suppressScrollOnNewData: false,
      localeText: this.faLocale,
      autoSizeStrategy: { type: 'fitGridWidth' },
      defaultColDef: {
        flex: 1,
        minWidth: 160,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        suppressHeaderMenuButton: true,
        wrapHeaderText: true,
        autoHeaderHeight: true
      }
    };

    if (this.showRowGroupPanel) {
      baseOptions.rowGroupPanelShow = 'always';
    }

    if (this.enableRangeSelection) {
      baseOptions.enableRangeSelection = true;
    }

    if (this.sideBar) {
      baseOptions.sideBar = this.sideBar;
    }

    const incomingDefault = this.gridOptions?.defaultColDef ?? {};

    baseOptions.defaultColDef = {
      ...baseOptions.defaultColDef,
      ...this.defaultColDef,
      ...incomingDefault
    };

    if (this.gridOptions) {
      const { defaultColDef: _omit, ...rest } = this.gridOptions;
      Object.assign(baseOptions, rest);
    }

    return baseOptions;
  }

  private updateGridOverlays(): void {
    if (!this.gridApi) {
      return;
    }

    if (this.loading) {
      this.gridApi.showLoadingOverlay();
      return;
    }

    const rowCount = this.rowData?.length ?? 0;
    if (rowCount === 0) {
      this.gridApi.showNoRowsOverlay();
    } else {
      this.gridApi.hideOverlay();
    }
  }
}
