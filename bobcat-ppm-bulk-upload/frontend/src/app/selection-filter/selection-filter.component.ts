// tslint:disable:component-selector variable-name no-string-literal typedef ter-indent ter-arrow-parens align max-line-length no-this-assignment prefer-template no-increment-decrement no-inferrable-types

import { IFilterAngularComp } from '@ag-grid-community/angular';
import { IDoesFilterPassParams, IFilterParams } from '@ag-grid-community/core';
import { Component } from '@angular/core';

@Component({
    selector: 'kl-selection-filter',
    templateUrl: './selection-filter.component.html',
    styleUrls: ['./selection-filter.component.scss'],
})
export class SelectionFilterComponent implements IFilterAngularComp {

    public filterValue: any = [];
    public params: IFilterParams;
    public optionList: any;
    public selectAll: boolean = false;
    public searchText: any = '';
    public appliedFilterAsString = null;
    agInit(params: IFilterParams): void {
        this.params = params;
        this.optionList = params['values'];
    }

    isFilterActive = () => this.filterValue && this.filterValue.length;

    doesFilterPass = (params: IDoesFilterPassParams): boolean => this.filterValue.includes(params.data[this.params.colDef.field]);

    getModel = () => {
        this.filterValue = this.optionList.filter((list) => list.checked).map((list) => list.value);
        this.selectAll = this.optionList.every((list) => list.checked);
        if (this.filterValue && this.filterValue.length) {
            return { values: this.filterValue };
        }
        return null;
    }

    setModel(setValue: any) {
        const filter = setValue?.filter || [];
        const isFilterNonEmpty = filter.length > 0;
        this.optionList.forEach(filterItem => filterItem.checked = isFilterNonEmpty ? filter.includes(filterItem.value) : false);
    }

    updateFilter() {
        const { valueArray, labelArray } = this.optionList.reduce((acc, list) => {
            if (list.checked) {
                acc.valueArray.push(list.value);
                acc.labelArray.push(list.label);
            }
            return acc;
        }, { valueArray: [], labelArray: [] });
        this.filterValue = valueArray;
        this.appliedFilterAsString = labelArray.join(',');
        setTimeout(() => {
            this.params.filterModifiedCallback();
            this.params.filterChangedCallback();
        }, 100)
    }

    selectAllList() {
        this.selectAll = !this.selectAll;
        this.optionList.forEach((item) => item.checked = this.selectAll);
    }

    getModelAsString = () => this.appliedFilterAsString;
}
