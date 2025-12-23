import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridComponent } from './ag-grid.component';
import { AgGridModule } from '@ag-grid-community/angular';
import { BtnCellRendererComponent } from '../btn-cell-renderer/btn-cell-renderer.component';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { MasterDetailModule } from '@ag-grid-enterprise/master-detail';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';
import { SelectionFilterComponent } from '../selection-filter/selection-filter.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UnescapePipeRendererComponent } from '../unescape-pipe-renderer/unescape-pipe-renderer.component';
import { UnescapePipe } from '../unescape-pipe-renderer/unescape.pipe';
import { TimeRangePickerComponent } from '../time-range-picker/time-range-picker.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';



@NgModule({
  declarations: [
    AgGridComponent,
    BtnCellRendererComponent,
    SelectionFilterComponent,
    StatusBarComponent,
    UnescapePipeRendererComponent,
    UnescapePipe,
    TimeRangePickerComponent
  ],
  imports: [
    CommonModule,
    AgGridModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgSelectModule,
    NgbModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    AgGridComponent,
    BtnCellRendererComponent,
    SelectionFilterComponent,
    StatusBarComponent,
    OwlDateTimeModule, OwlNativeDateTimeModule
  ], providers: []
})
export class AggridComponentModule {
  constructor() {
    const modules: any = [
      ClientSideRowModelModule,
      InfiniteRowModelModule,
      MenuModule,
      RowGroupingModule,
      ColumnsToolPanelModule,
      FiltersToolPanelModule,
      MasterDetailModule,
      ServerSideRowModelModule,
      ClipboardModule,
      RangeSelectionModule,
      SetFilterModule,
      StatusBarModule,
    ];
    ModuleRegistry.registerModules(modules);
  }

}
