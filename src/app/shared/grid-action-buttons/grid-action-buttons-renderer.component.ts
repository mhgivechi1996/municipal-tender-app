import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

export interface GridActionButtonConfig<TData = unknown> {
  icon: string;
  nzType?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  nzShape?: 'circle' | 'round';
  nzDanger?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  disabled?: boolean | ((record: TData | null, params: ICellRendererParams<TData>) => boolean);
  onClick?: (record: TData | null, params: ICellRendererParams<TData>) => void;
}

type GridActionRendererParams<TData> = ICellRendererParams<TData> & {
  buttons?: GridActionButtonConfig<TData>[];
};

@Component({
  selector: 'app-grid-action-buttons-renderer',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzToolTipModule],
  template: `
    <div class="grid-actions" *ngIf="buttons.length; else emptyActions">
      <button
        *ngFor="let button of buttons"
        nz-button
        nz-tooltip
        class="grid-action-button"
        [nzType]="button.nzType ?? 'default'"
        [nzShape]="button.nzShape ?? 'circle'"
        [nzDanger]="button.nzDanger ?? false"
        [disabled]="isDisabled(button)"
        [attr.aria-label]="button.ariaLabel || button.icon"
        (click)="onButtonClick($event, button)"
        [nzTooltipTitle]="button.tooltip ?? null"
      >
        <span nz-icon [nzType]="button.icon"></span>
      </button>
    </div>
    <ng-template #emptyActions>
      <span class="no-actions"></span>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .grid-actions {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
      }

      .no-actions {
        display: inline-block;
        width: 100%;
        height: 100%;
      }

      .grid-action-button {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .grid-action-button span[nz-icon] {
        font-size: 16px;
        line-height: 1;
      }
    `
  ]
})
export class GridActionButtonsRendererComponent<TData = unknown> implements ICellRendererAngularComp {
  buttons: GridActionButtonConfig<TData>[] = [];
  private params!: ICellRendererParams<TData>;

  agInit(params: ICellRendererParams<TData>): void {
    this.params = params;
    this.buttons = this.resolveButtons(params);
  }

  refresh(params: ICellRendererParams<TData>): boolean {
    this.params = params;
    this.buttons = this.resolveButtons(params);
    return true;
  }

  private resolveButtons(params: ICellRendererParams<TData>): GridActionButtonConfig<TData>[] {
    const rendererParams = params as GridActionRendererParams<TData>;
    if (!rendererParams.buttons || !Array.isArray(rendererParams.buttons)) {
      return [];
    }
    return rendererParams.buttons;
  }

  isDisabled(button: GridActionButtonConfig<TData>): boolean {
    if (typeof button.disabled === 'function') {
      return button.disabled(this.params?.data ?? null, this.params);
    }
    return button.disabled ?? false;
  }

  onButtonClick(event: MouseEvent, button: GridActionButtonConfig<TData>): void {
    event.preventDefault();
    event.stopPropagation();
    button.onClick?.(this.params?.data ?? null, this.params);
  }
}
