import {
  Injectable, ApplicationRef, ComponentFactoryResolver,
  Injector, EmbeddedViewRef, ComponentRef
} from '@angular/core';
import { ApploaderComponent } from './apploader.component';


@Injectable({
  providedIn: 'root'
})
export class ApploaderService {
  private loaderRef: ComponentRef<ApploaderComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  show() {
    if (this.loaderRef) return; // already showing

    const factory = this.componentFactoryResolver.resolveComponentFactory(ApploaderComponent);
    this.loaderRef = factory.create(this.injector);
    this.appRef.attachView(this.loaderRef.hostView);

    const domElem = (this.loaderRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    document.body.appendChild(domElem);
  }

  hide() {
    if (!this.loaderRef) return;

    this.appRef.detachView(this.loaderRef.hostView);
    this.loaderRef.destroy();
    this.loaderRef = null;
  }
}
