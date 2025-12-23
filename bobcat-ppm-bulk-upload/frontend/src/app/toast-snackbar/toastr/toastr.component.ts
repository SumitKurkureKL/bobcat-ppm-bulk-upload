import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs';
import { ToastrService } from './toastr.service';
import { ToastrState } from './toastr-state';

import { Toast, ToasterService, ToasterConfig, BodyOutputType } from 'angular2-toaster';
import { Config } from '../../config/config';

@Component({
  selector: 'app-toastr',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.scss']
})
export class ToastrComponent implements OnInit, OnDestroy {
public config1: ToasterConfig = new ToasterConfig({
    positionClass: 'toast-top-right',
  });
  private subscription: any;

  constructor(public toasterService: ToasterService, public toasterLoad: ToastrService) { }

  ngOnInit() {
    this.subscription = this.toasterLoad.loaderState.subscribe((toast: ToastrState) => {
      const trigger: Toast = {
        type: toast.type,
        title: toast.title,
        body: toast.body,
        showCloseButton: toast.close,
        bodyOutputType: BodyOutputType.TrustedHtml,
        closeHtml:`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.00302 5.296L2.35702 1.65L1.65002 2.357L5.29702 6.003L1.65002 9.649L2.35702 10.357L6.00302 6.71L9.65002 10.357L10.357 9.649L6.71002 6.003L10.357 2.357L9.65002 1.65L6.00302 5.296Z" fill="white"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.00302 5.296L2.35702 1.65L1.65002 2.357L5.29702 6.003L1.65002 9.649L2.35702 10.357L6.00302 6.71L9.65002 10.357L10.357 9.649L6.71002 6.003L10.357 2.357L9.65002 1.65L6.00302 5.296Z" fill="white"/>
                  </svg>`,
      };
      if (toast.timeOut) {
        trigger['timeout'] = toast.timeOut;
      }
      this.toasterService.pop(trigger);
    });
  }


  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
