import { Component, Input, Output, EventEmitter, SimpleChanges, TemplateRef} from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { BtnCellRendererComponent } from '../btn-cell-renderer/btn-cell-renderer.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { UnescapePipeRendererComponent } from '../unescape-pipe-renderer/unescape-pipe-renderer.component';
import { SelectionFilterComponent } from '../selection-filter/selection-filter.component';
import { TimeRangePickerComponent } from '../time-range-picker/time-range-picker.component';
import { HttpLayerService } from '../services/http-layer.service';


@Component({
  selector: 'kl-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.scss']
})
export class AgGridComponent {
  @Input() agGridOptions: any = {};
  @Output() aggridEmitter = new EventEmitter();
  @Input() Height: any;
  @Input() filterSearch: any;
  @Input()clickableColumns: any = [];
  @Input() textSelectionEnable: any = true;
  @Input() hideContentMenu: any = true;
  public externalSearch: any;
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public gridApi: any;
  public gridColumnApi: any;
  public overlayLoadingTemplate = '<span class="ag-overlay-loading-center">Please wait while your rows are loading</span>';
  public overlayNoRowsTemplate = `<div class="container mt-4" style="pointer-events:auto">
                                  <h6 class="mt-2">No results found</h6>`;


  public globalFilter = new Subject<any>();
  @Input() externalTemplate: TemplateRef<any>;
  public selectAllRecords: boolean = false;
  public rowsPerPage: any;
  constructor(private httplayer: HttpLayerService) {

  }
  ngOnInit(): void {
    if (this.agGridOptions?.actions?.length) {
      const index = this.agGridOptions.columnDefs.findIndex((el:any) => el.cellRenderer === 'buttonRenderer');
      if (index === -1) {
        this.agGridOptions.columnDefs.push({
          headerName: 'Actions',
          field:'actions',
          cellRenderer: 'buttonRenderer',
          filter: false,
          floatingFilter: false,
          editable: false,
          sortable: false,
          maxWidth: 160,
          minWidth:  130,
          pinned: this.agGridOptions.pinActions,
          cellRendererParams: {
            onClick: this.changeActions.bind(this),
            actions: this.agGridOptions.actions,
          },
        });
        this.clickableColumns = [...this.clickableColumns];
        this.agGridOptions = { ...this.agGridOptions };
      }
    }

    if (this.agGridOptions.defaultColDef) {
      this.agGridOptions.defaultColDef['tooltipShowDelay'] = 0;
      this.agGridOptions.defaultColDef['tooltipValueGetter'] = (p:any) => p.value;
    }
    this.setColumnsClick();

    this.globalFilter.pipe(debounceTime(500)).subscribe((data) => {
      if (this.gridApi) {
        this.agGridOptions.payload['global_filters']['search'] = data.global_search;
        if (!data.global_search) { delete this.agGridOptions.payload['global_filters']['search']; }
        this.gridApi.purgeInfiniteCache();
      }
    });
    this.agGridOptions['frameworkComponents'] = {
      buttonRenderer: BtnCellRendererComponent,
      customStatusBar: StatusBarComponent,
      selectionFilter : SelectionFilterComponent,
      timeRangeFilter: TimeRangePickerComponent,


    };

    document.addEventListener('click', (e:any) => {
      if (e.target['id'] === 'clearFilters') {
        this.resetFilters();
      }
    });

    if (this.agGridOptions.statusBar?.statusPanels?.length) {
      const ind = this.agGridOptions.statusBar.statusPanels.findIndex((ele: any) => ele.statusPanel === 'customStatusBar');
      if (ind > -1) {
        this.agGridOptions.statusBar.statusPanels[ind]['statusPanelParams'] = {
          total_no: () => this.rowsPerPage,
          onclick: this.changeActions.bind(this),
          enableTablePrefBtn:this.agGridOptions.saveTablePreference
        };
      }
    }
    this.agGridOptions['onPaginationChanged'] = this.onPaginationChanged.bind(this);

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['clickableColumns'] && changes['clickableColumns'].previousValue !== changes['clickableColumns'].currentValue) {
      this.clickableColumns = [...this.clickableColumns];
    }
    if (changes['clickableColumns']) {
      this.setColumnsClick();
    }
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    if (this.agGridOptions.rowModelType === 'clientSide') {
      return;
    }
    const self: any = this;
    const dataSource = {
      getRows: (params:any) => {
        let payload:any = {
          start_row: params.startRow,
          end_row: params.endRow,
          page: params.endRow / (params.endRow - params.startRow),
          records: (params.endRow - params.startRow),
        };
        if (self.filterSearch) {
          payload['filters'] = params;
          delete payload['filters']['endRow'];
          delete payload['filters']['startRow'];
        }
        if (self.agGridOptions && self.agGridOptions.payload) {
          payload = { ...payload, ...self.agGridOptions.payload };
        }
        self.gridApi.showLoadingOverlay();
        self.httplayer.post(self.agGridOptions.dataURL, payload).pipe(takeUntil(this.destroy$)).subscribe((resp: any) => {
          if (resp && resp.status === 'success') {
            let rowsThisPage = [];
            if (resp.data && resp.data.bodyContent) {
              rowsThisPage = resp.data.bodyContent;
            }
            if (resp['data']['total_no']) {
              self.agGridOptions['context'] = resp.data.total_no || 0;
            }
            if ((resp.data && resp.data.total_no) || (resp.data.total_no === 0)) {
              self.agGridOptions['total_no'] = resp.data.total_no ? resp.data.total_no : 0;
            }
            self.gridApi.hideOverlay();
            self.agGridOptions['rowData'] = rowsThisPage;
            if (!rowsThisPage.length) {
              self.gridApi.showNoRowsOverlay();
            }
            params.successCallback(rowsThisPage, resp.data.total_no ?? -1);
          } else {
            self.gridApi.hideOverlay();
            params.failCallback();
          }
        }, (error: any) => {
          self.gridApi.hideOverlay();
          params.failCallback();
          console.error(error);
        });
      },
    };
    this.gridApi.setDatasource(dataSource);
  }


  changeActions(data: any) {
    this.aggridEmitter.emit(data);
  }

  setColumnsClick(headerData?:any) {
    try {
      this.setUnescapePipe(headerData);
      if (!this.clickableColumns?.length) {
        return;
      }
      if (headerData) {
        if (headerData?.length) {
          for (const eachItem of this.clickableColumns) {
            const eleInd = headerData.findIndex((ele: any) => ele?.field === eachItem || ele?.key === eachItem || ele?.value === eachItem);
            if (eleInd > -1) {
              headerData[eleInd]['cellRenderer'] = this.anchorTagCR;
            }
          }
        }
        return headerData;
      }
      if (!this.agGridOptions?.columnDefs?.length) {
        return;
      }
      for (const eachItem of this.clickableColumns) {
        const eleInd = this.agGridOptions.columnDefs.findIndex((ele: any) => ele?.field === eachItem || ele?.key === eachItem || ele?.value === eachItem);
        if (eleInd > -1) {
          this.agGridOptions.columnDefs[eleInd]['cellRenderer'] = this.anchorTagCR;
        }
      }
      this.agGridOptions = { ...this.agGridOptions };
    } catch (columnErr) {
      console.error(columnErr);
    }
  }

  setUnescapePipe(headerContent?) {
    try {
      if (headerContent?.length) {
        this.agGridOptions.columnDefs = headerContent;
        return this.appendUnescapePipe(this.agGridOptions.columnDefs);
      }
      if (!this.agGridOptions?.columnDefs?.length) {
        return;
      }
      this.agGridOptions.columnDefs = this.appendUnescapePipe(this.agGridOptions.columnDefs);
      this.agGridOptions = { ...this.agGridOptions };
    } catch (error) {
      console.error(error);
    }
  }
  appendUnescapePipe(headerContent) {
    try {
      headerContent.forEach(element => {
        if(!element.cellRenderer || element.passUnescapePipe) {
          element['cellRenderer'] = UnescapePipeRendererComponent
        }
      });
      return headerContent;
    } catch(error) {
      console.error(error)
    }
  }

  anchorTagCR(params: ICellRendererParams) {
    if (params.value === undefined || params.value === null || !params?.data) {
      return '';
    }
    const anchor_tag = `<a title="" style="text-decoration: none;" href="javascript:void(0)">${params.value}</a>`;
    return anchor_tag
  }

  searchAction(data: any) {
    try {
      if(this.agGridOptions.rowModelType ==='infinite'){
        this.globalFilter.next(data);
      }else{
        this.gridApi.setQuickFilter(data.global_search);
      }

    } catch (emitError) {
      console.error(emitError)
    }
  }


  onCellClicked(e: any) {
    try {
      if (!e?.colDef?.field || !(this.clickableColumns?.length) || !(this.clickableColumns.includes(e.colDef.field))) {
        return;
      }
      if (e?.data?.disabledActions?.length && e?.data?.disabledActions?.includes(e?.colDef?.['action']?.['action'] || 'edit')) {
        return;
      }
      const emitpayload: any = {
        action: e?.colDef?.action || {
          action: 'edit',
          type: 'edit'
        },
        data: e.data,
        rowIndex: e.rowIndex,
      };
      this.aggridEmitter.emit(emitpayload);
    } catch (cellErr) {
      console.error(cellErr);
    }
  }

  resetFilters() {
    this.agGridOptions.api?.setFilterModel();
    this.agGridOptions.columnApi?.resetColumnState();
  }

  externalActionsValidation = (type?:any) => {
    const headers = this.gridApi.getColumnDefs();
    const index = headers.findIndex((element: any) => element.key === this.agGridOptions['externalActionsCustomValidations']['column_key']);
    if (index > -1) {
      const selectedNodes = this.gridApi.getSelectedNodes();
      let field_values = [];
      if (type && type.action ==='selectAll'){
        this.agGridOptions.externalActions.forEach(external_action => {
          if(type.checked){
            external_action['disabled'] = external_action.action !== 'remove';
          } else {
            external_action['disabled'] = false;
          }
        })
      } else if (selectedNodes.length > 0) {
          selectedNodes.forEach(element => {
            if (element['data'][this.agGridOptions['externalActionsCustomValidations']['column_key']]) {
              field_values.push(element['data'][this.agGridOptions['externalActionsCustomValidations']['column_key']]);
            }
          })
          field_values = Array.from(new Set(field_values));
          let enabled_actions = [];
          field_values.forEach((element, index) => {
            if (index === 0) {
              enabled_actions = this.agGridOptions['externalActionsCustomValidations']['validations'][element]
            } else {
              enabled_actions = enabled_actions.filter((element2) => this.agGridOptions['externalActionsCustomValidations']['validations'][element].includes(element2));
            }
          })
          enabled_actions.forEach((enabled, index) => {
            enabled = enabled.toLowerCase();
            enabled = enabled.replace(/ /g, '_');
            enabled_actions[index] = enabled;
          })
          this.agGridOptions.externalActions.forEach(external_action => {
            if (!external_action['no_validation']) {
              external_action['disabled'] = !enabled_actions.includes(external_action.action);
            } else {
              external_action['disabled'] = false;
            }
          });
        } else {
          this.agGridOptions.externalActions.forEach(external_action => {
            external_action['disabled'] = false;
          })
      }
    } else {
      this.agGridOptions.externalActions.forEach(external_action => {
        external_action['disabled'] = false;
      })
    }
  }

  onSelectionChanged(event: any) {
    try {
      if (event.action === 'selectAll') {
        const headers = this.gridApi.getColumnDefs();
        this.selectAllRecords = event.checked;
        if (event.checked) {
          headers.forEach(element => {
            if (element['checkboxSelection'] && element['_selectAll']) {
              this.gridApi.deselectAll();
              element['checkboxSelection'] = false;
            }
          });
        } else {
          headers.forEach(element => {
            if (element['_selectAll']) {
              element['checkboxSelection'] = true;
            }
          });
        }
        setTimeout(() => {
          this.gridApi.setColumnDefs(headers);
          this.gridApi.refreshCells();
        }, 100);
        if (this.agGridOptions['externalActionsCustomValidations'] && this.agGridOptions['externalActionsCustomValidations']['column_key'] && this.agGridOptions['externalActionsCustomValidations']['validations']) {
          this.externalActionsValidation(event);
        }
        this.aggridEmitter.emit(event);
      } else if (event.global_search || event.global_search === "") {
        this.externalSearch = event.global_search;
      } else if (this.agGridOptions['externalActionsCustomValidations'] && this.agGridOptions['externalActionsCustomValidations']['column_key'] && this.agGridOptions['externalActionsCustomValidations']['validations']) {
        this.externalActionsValidation();
        this.aggridEmitter.emit(event);
      } else {
        this.aggridEmitter.emit(event);
      }
    } catch (emitError) {
      console.error(emitError);
    }
  }


  onRowClicked(event: any) {
    this.aggridEmitter.emit(event);
  }

  ngOnDestroy(): void {
    if (this.globalFilter) { this.globalFilter.unsubscribe(); }
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }

  headerHeightGetter() {
    const columnHeaderTexts = Array.from(document.querySelectorAll('.ag-header-cell-text'));
    const clientHeights = columnHeaderTexts.map(
      (headerText) => headerText.clientHeight
    );
    return Math.max(...clientHeights);
  }
  headerHeightSetter() {
    const height = this.headerHeightGetter() + 20;
    this.agGridOptions.api?.setHeaderHeight(height);
  }

  onPaginationChanged(event: any) {
    const api = event.api;
    const currentPage = api.paginationGetCurrentPage();
    const pageSize = api.paginationGetPageSize();
    const totalRows = api.getDisplayedRowCount();
    const startRow = currentPage * pageSize;
    const endRow = Math.min(startRow + pageSize, totalRows);
    const rowsOnCurrentPage = endRow - startRow;
    this.rowsPerPage = rowsOnCurrentPage;
  }

}
