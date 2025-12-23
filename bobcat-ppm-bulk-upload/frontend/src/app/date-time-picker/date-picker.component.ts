// tslint:disable:component-selector variable-name no-string-literal typedef ter-indent ter-arrow-parens align max-line-length no-this-assignment prefer-template no-increment-decrement no-inferrable-types
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import moment, { Moment } from 'moment';
import { OwlDateTimeComponent } from 'ng-pick-datetime';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'kl-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
})
export class DatePickerComponent implements OnInit {
  @Input() value: any;
  @Input() fontSize: any;
  @Input() disabled: any;
  @Input() customOptions: any = {};
  @Output() valueChange = new EventEmitter<any>();

  public showPicker = false;
  public date = new FormControl(moment());
  constructor() { }

  ngOnInit() {
    if (!this.customOptions.hasOwnProperty('pickDate')) {
      this.customOptions['pickDate'] = true;
    }
    if (this.value && this.value.length === 2) { //if it is date range
      this.value = this.value.map((item: Date) => new Date(item));
    } else {
      this.value = this.value ? new Date(this.value) : null;
    }

    setTimeout(() => {
      this.showPicker = true;
    }, 200);
  }

  emitChanges() {
    let calcValue = this.value ? new Date(this.value['_d']) : null;
    this.valueChange.emit(calcValue);
  }

  yearHandler(normalizedYear: Moment, datepicker: OwlDateTimeComponent<Moment>) {
    try {
      const dateValue = this.date.value;
      dateValue.year(normalizedYear.year());
      this.date.setValue(dateValue);
      if (this.customOptions.pickOnlyYear) { // If date type is YEAR closing picker after selecting year
        this.value = dateValue;
        let calcValue = this.value ? new Date(this.value['_d']) : null;
        this.valueChange.emit(calcValue);
        datepicker.close();
      }
    } catch (error) {
      console.error(error);
    }
  }
  //closing the date picker on select of month(datetype Month)
  monthHandler(normalizedMonth: Moment, datepicker: OwlDateTimeComponent<Moment>) {
    try {
      const dateValue = this.date.value;
      dateValue.month(normalizedMonth.month());
      this.value = dateValue;
      let calcValue = this.value ? new Date(this.value['_d']) : null;
      this.valueChange.emit(calcValue);
      datepicker.close();
    } catch (error) {
      console.error(error);
    }
  }
  emitData() {
    try {
      this.valueChange.emit(this.value);
    } catch (error) {
      console.error(error);
    }
  }

  restrictionFilter = (d: Date): boolean => {
    const day = new Date(d).getDay();
    if (!this.customOptions) {
      return true;
    }
    if (this.customOptions.disableWeekends && this.customOptions.disableWeekdays) {
      return false;
    }
    if (this.customOptions.disableWeekends && !this.customOptions.disableWeekdays) {
      return day !== 0 && day !== 6;
    }
    if (!this.customOptions.disableWeekends && this.customOptions.disableWeekdays) {
      return day === 0 || day === 6;
    }
    if (!this.customOptions.disableWeekends && !this.customOptions.disableWeekdays) {
      return true;
    }
    return false;
  }
}
