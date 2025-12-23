import { Component } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';

@Component({
  selector: 'app-btn-cell-renderer',
  templateUrl: './btn-cell-renderer.component.html',
  styleUrls: ['./btn-cell-renderer.component.scss']
})
export class BtnCellRendererComponent implements ICellRendererAngularComp {
  public params:any;
  public actions: any = [];
  public hidden: boolean = false;
  public popoverAction: any;
  public disabledActions: string[] = [];

  get rowData () {
    return this.params?.node?.data;
  }
  agInit(params:any): void {
    this.params = params;
    this.actions = JSON.parse(JSON.stringify(this.params.actions));
    if (this.params?.data?.disabledActions) {
      this.disabledActions = this.params.data.disabledActions;
      if (this.actions && this.actions.length) {
        this.actions.forEach(ele => {
          if (ele && ele['type'] === 'menu') {
            if (ele['options']) {
              ele.options = ele.options.filter(item => !this.disabledActions.includes(item.action));
            }
          }
        })
      }
    }
    if (params.hidden instanceof Function) {
      this.hidden = params.hidden({ data: params.node.data });
    }
  }

  refresh(params?: any): boolean {
    return true;
  }

  onClick(action: any, popover?) {
    if (action.action === 'menu' && popover) {
      this.popoverAction = action;
      popover.open();
      return;
    }
    if (this.params.onClick instanceof Function) {
      const params = {
        action: action,
        data: this.params.node.data,
        rowIndex: this.params.rowIndex,
      };
      this.params.onClick(params);
    }
  }

}
