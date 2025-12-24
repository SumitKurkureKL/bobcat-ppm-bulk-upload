import { NgModule, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';
import { ToasterModule } from 'angular2-toaster';
import { ToastSnackbarModule } from './toast-snackbar/toast-snackbar.module';
import { CommonModule, DatePipe } from '@angular/common';
import { BulkUploadComponent } from './bulk-upload/bulk-upload.component';
import { AgGridModule } from '@ag-grid-community/angular';
import { ExternalActionComponent } from './external-action/external-action.component';
import { ApploaderComponent } from './apploader/apploader.component';
import { BtnCellRendererComponent } from './btn-cell-renderer/btn-cell-renderer.component';
import { DatePickerComponent } from './date-time-picker/date-picker.component';
import { SelectionFilterComponent } from './selection-filter/selection-filter.component';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { TimeRangePickerComponent } from './time-range-picker/time-range-picker.component';
import { UnescapePipeRendererComponent } from './unescape-pipe-renderer/unescape-pipe-renderer.component';
import { AgGridComponent } from './ag-grid/ag-grid.component';

@NgModule({
  declarations: [AppComponent,BulkUploadComponent,ExternalActionComponent,AgGridComponent,ApploaderComponent,BtnCellRendererComponent,DatePickerComponent,SelectionFilterComponent,StatusBarComponent,TimeRangePickerComponent,UnescapePipeRendererComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgSelectModule,
    NgbModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    FormsModule,
    HttpClientModule,
    ToastSnackbarModule,
    ToasterModule.forRoot(),
    AgGridModule,
    NgbTooltipModule,
    CommonModule,
    ReactiveFormsModule,
    AgGridModule
  ],
  exports: [OwlDateTimeModule, OwlNativeDateTimeModule],
  providers: [DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(public injector: Injector) {
    if (!customElements.get('bobcat-ppm-bulk-upload')) {
      customElements.define('bobcat-ppm-bulk-upload', createCustomElement(AppComponent, { injector: this.injector }));
    }
  }

  ngDoBootstrap() {}
}
