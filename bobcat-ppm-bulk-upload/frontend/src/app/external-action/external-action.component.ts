import { Component, Input, Output, TemplateRef, EventEmitter } from '@angular/core';

@Component({
  selector: 'kl-external-action',
  templateUrl: './external-action.component.html',
  styleUrls: ['./external-action.component.scss'],
})
export class ExternalActionComponent {
  @Input() extAction: any;
  @Input() template!: TemplateRef<any>;
  @Input() fieldId: any;
  @Output() externalActionEmitter = new EventEmitter();
  public externalSearch: any;
  constructor(){
    console.log(this);
  }
  emitAction(data: any, event?: any) {
    try {
      const dataObj = data;
      if (event) {
        dataObj.event = event;
      }
      this.externalActionEmitter.emit(dataObj);
    } catch (emitError) {
      console.error(emitError);
    }
  }
}
