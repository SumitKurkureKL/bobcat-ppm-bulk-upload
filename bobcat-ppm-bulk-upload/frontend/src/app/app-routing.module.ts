import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BulkUploadComponent } from './bulk-upload/bulk-upload.component';

const routes: Routes = [
  { path: '', redirectTo: 'bulk-upload', pathMatch: 'full' },
  {path: 'bulk-upload', component: BulkUploadComponent }
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})


export class AppRoutingModule { }
