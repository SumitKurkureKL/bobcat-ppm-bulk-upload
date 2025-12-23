import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrComponent } from './toastr/toastr.component';
import { ToasterModule, ToasterService } from 'angular2-toaster';


@NgModule({
  declarations: [
    ToastrComponent
  ],
  imports: [
    CommonModule,
    ToasterModule
  ],
  exports: [
    ToastrComponent
  ],
  providers: [
    ToasterService
  ]
})
export class ToastSnackbarModule { }
