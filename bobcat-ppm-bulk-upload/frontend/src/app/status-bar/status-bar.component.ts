import { IStatusPanelAngularComp } from '@ag-grid-community/angular';
import { Component } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss']
})
export class StatusBarComponent implements IStatusPanelAngularComp {

  public params: any;

  agInit(params: any): void {
    this.params = params;
  }

}
