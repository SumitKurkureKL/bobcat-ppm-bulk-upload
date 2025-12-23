// tslint:disable:component-selector variable-name no-string-literal typedef ter-indent ter-arrow-parens align max-line-length no-this-assignment prefer-template no-increment-decrement no-inferrable-types
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
@Component({
  selector: 'kl-time-range-picker',
  templateUrl: './time-range-picker.component.html',
})
export class TimeRangePickerComponent implements OnInit, OnDestroy {

  @Input() inputModel: any = {
    custom: {},
  };
  @Input() timeRangeList: any;
  @Input() fontSize: any;
  @Input() settings: any;
  @Input() displayMode = '';
  @Input() popoverClass = '';
  @Output() inputModelChange: EventEmitter<any> = new EventEmitter<any>();

  public showTimeRange = false;
  public calendarSettings: any = {
    bigBanner: true,
    enableTime: true,
    format: 'dd-MM-yyyy HH:mm:ss',
    defaultOpen: false,
    closeOnSelect: true,
  };
  public dateRangeSettings = {
    bigBanner: false,
    enableTime: false,
    format: 'dd-MM-yyyy',
    defaultOpen: false,
    closeOnSelect: true,
  };
  public metaData = {
    products: [],
    stage_updates: {},
    hierarchyFilters: [],
    dropdownOpt: {},
    filterBy: [
      {
        label: 'Shift',
        value: 'shift',
      },
    ],
    shiftsList: [],
  };
  public popoverContent: any;
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public visualServiceSub: Subscription;
  public mediaResolutionSubscription: Subscription;
  constructor() {
  }

  ngOnInit() {
    if (!this.inputModel || !this.inputModel['custom']) {
      this.inputModel = {
        custom: {},
      };
    }
    this.inputModel['custom']['pickerType'] = this.inputModel['custom']['pickerType'] || 'dateTimeRange';
  }

  showDropdownValues(event, p) {
    try {
      this.popoverContent = p;
      if (this.displayMode === 'popover') {
        this.popoverContent.open();
        if (this.popoverClass) {
          const diff = window.innerWidth - event.x;
          const diffY = window.innerHeight - event.y
          if (event.x > 800 && diff < 800) {
            document.documentElement.style.setProperty('--leftStyle', '-720px');
            document.documentElement.style.setProperty('--pickerLeft', '-720px');
          } else if (event.x < 800) {
            document.documentElement.style.setProperty('--pickerLeft', '-150px');
          }
          document.documentElement.style.setProperty('--topStyle', diffY < 300 ? '-320px' : '0px');
        }
      }
      event.stopPropagation();
      event.preventDefault();
      if (!this.inputModel.custom) {
        const today = new Date();
        this.inputModel.custom = {
          from: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0),
          to: new Date(),
        };
      }
      this.showTimeRange = true;
    } catch (error) {
      console.error(error);
    }
  }
  getCopy(obj: any) {
    return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
  }

  applyCustomRange() {
    try {
      if (this.inputModel.custom['fromDisp'] === undefined) {
        this.inputModel['custom']['fromDisp'] = new Date();
      }
      if (this.inputModel.custom['toDisp'] === undefined) {
        this.inputModel.custom['toDisp'] = new Date();
      }
      if (new Date(this.inputModel.custom['fromDisp']).getTime() > new Date(this.inputModel.custom['toDisp']).getTime()) {
        return;
      }
      if (new Date(this.inputModel.custom['toDisp']).getTime() - new Date(this.inputModel.custom['fromDisp']).getTime() > 15724800000) {
        return;
      }
      this.inputModel.custom['to'] = new Date(this.inputModel.custom['toDisp']).getTime();
      this.inputModel.custom['from'] = new Date(this.inputModel.custom['fromDisp']).getTime();
      this.inputModel.timeRange = '';
      if (this.inputModel['custom']['pickerType'] === 'dateRange'){
        const formatDate = (date: Date): string => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear().toString();
          return `${day}/${month}/${year}`;
        };
        const from = formatDate(new Date(this.inputModel.custom['fromDisp']));
        const to = formatDate(new Date(this.inputModel.custom['toDisp']));
        this.inputModel.timeRangeLabel = from + ' - ' + to;
      } else{
        const from = this.getFormattedDateTime(new Date(this.inputModel.custom['fromDisp']));
        const to = this.getFormattedDateTime(new Date(this.inputModel.custom['toDisp']));
        this.inputModel.timeRangeLabel = from + ' - ' + to;
      }
      this.inputModel.isCustom = true;
      this.closeDropdownValues();
      this.emitChanges();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Method for assigning predefined time range into the chart options
   * @param selectedVal selected range
   */
  selectTimeRange(selectedVal) {
    try {
      this.inputModel.timeRange = selectedVal.value;
      this.inputModel.timeRangeLabel = selectedVal.label;
      this.inputModel.isCustom = false;
      this.closeDropdownValues();
      this.emitChanges();
    } catch (error) {
      console.error(error);
    }
  }

  @HostListener('document:click', ['$event'])
  clickout($event) {
    if ($event.target.nodeName === 'svg' || $event.target.className?.includes('owl-dt')) {
      return;
    }
    this.closeDropdownValues();
  }

  /**
   * Method for closing custom tim range popup
   */
  closeDropdownValues() {
    try {
      if (this.showTimeRange) {
        this.showTimeRange = false;
        if (this.popoverContent) {
          this.popoverContent.close();
          document.documentElement.style.setProperty('--leftStyle', null);
          document.documentElement.style.setProperty('--pickerLeft', null);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  emitChanges() {
    this.inputModelChange.emit(this.inputModel);
  }

  getFormattedDateTime(date, format?): string {
    try {
      return this.convertTZ(date);
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  convertTZ = (date: any, options?: any) => {
    if (!date) {
      return undefined;
    }
    const tzString: any = this.getTZ();
    const _d = new Date((typeof date === 'string' ? new Date(date) : date));
    let tzOptions: any = { timeZone: tzString };
    if (options) {
      tzOptions = { ...tzOptions, ...options};
    }
    return _d.toLocaleString('en-US', tzOptions);
  }

  getTZ() {
    const tzString: any =  Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tzString;
  }
  
  onDateChangeForShift() {
    this.inputModel['custom']['selectedShift'] = null;
    this.inputModel['custom']['shiftActivity'] = [];
  }

  applyFilters(data?) {
    let filterValue: any = [new Date(), new Date()];
    if (this.inputModel['custom']['shiftActivity'] && this.inputModel['custom']['shiftActivity'].length) {
      const activities = this.getCopy(this.inputModel['custom']['shiftActivity']);
      let from_time = activities[0]['from_time'];
      let to_time = activities[0]['to_time'];
      for (const iterator of activities) {
        if (from_time > iterator.from_time) {
          from_time = iterator.from_time;
        }
        if (to_time < iterator.to_time) {
          to_time = iterator.to_time;
        }
      }
      filterValue = [new Date(from_time || new Date()).getTime(), new Date(to_time || new Date()).getTime()];
    } else if (this.inputModel['custom']['selectedDate']) {
      filterValue[0] = new Date(this.inputModel['custom']['selectedDate']).setHours(0, 0, 0, 0);
      filterValue[1] = new Date(this.inputModel['custom']['selectedDate']).setHours(23, 59, 59, 59);
    }
    filterValue[0] = new Date(filterValue[0] || new Date());
    filterValue[1] = new Date(filterValue[1] || new Date());
    const from = new Date(filterValue[0]).getTime();
    const to = new Date(filterValue[1]).getTime() - 1000;
    const fromFormatted = this.formatDate(filterValue[0]);
    const toFormatted = this.formatDate(filterValue[1]);
    this.inputModel.custom['from'] = from;
    this.inputModel.custom['to'] = to;
    this.inputModel.timeRange = '';
    this.inputModel.timeRangeLabel = `${fromFormatted} - ${toFormatted}`;
    this.inputModel.isCustom = true;
    this.closeDropdownValues();
    this.emitChanges();
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = ('0' + date.getDate()).slice(-2);
    const month = date.toLocaleString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  onRadioButtonChange(value: string) {
    this.inputModel.custom.pickerType = value;
  }
  ngOnDestroy() {
    if (this.mediaResolutionSubscription) {
      this.mediaResolutionSubscription.unsubscribe();
    }
    if (this.visualServiceSub) {
      this.visualServiceSub.unsubscribe();
    }
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
