import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'kl-unescape-pipe-renderer',
  template: `<span *ngIf="![null, undefined].includes(params.value)">{{ (params.value | unescape) || '' }}</span>`
})

export class UnescapePipeRendererComponent implements ICellRendererAngularComp {
  public params;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams) {
    return false;
  }
}
