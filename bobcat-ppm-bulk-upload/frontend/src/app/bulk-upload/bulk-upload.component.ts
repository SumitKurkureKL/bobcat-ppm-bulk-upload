import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpLayerService } from '../services/http-layer.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as CryptoJS from 'crypto-js';
import { ToastrService } from '../toast-snackbar/toastr/toastr.service';
import { AuthService } from '../services/auth.service';
import { Config } from '../config/config';

@Component({
  selector: 'ut-webapp-bulk-upload',
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.scss'],
})
export class BulkUploadComponent implements OnInit {
  public selectedBulkUploadType = null;
  public listBulkUploadTypes: any = [
    {
      label: 'Create Product',
      value: 'product',
      schema: "{\"page_schema\":\"public\",\"page_type\":\"batchDataModel\"}"
    },
    {
      label: 'Ideal Cycle Time',
      value: 'idealcycletime',
      schema: "{\"page_schema\":\"public\",\"page_type\":\"batchDataModel\"}"
    }
  ];
  public projectDetails: any = {};
  public destroy$: Subject<boolean> = new Subject<boolean>();
  public subscription: Subscription;
  public productMasterData: any = {
    dataMethod: 'getProcessListData',
    dataURL : 'model_mgmt/body',
    columnDefs: [],
    rowData: [],
    height: 'calc(100vh - 233px)',
    filter_key: true,
    filters: {},
    defaultColDef: {
      flex: 1,
      resizable: true,
      filter: 'agTextColumnFilter',
      editable: false,
      floatingFilter: true,
      sortable: true,
    },
    statusBar: {
      statusPanels: [
        {
          statusPanel: 'customStatusBar',
          align: 'left',
        },
      ],
    },
    defaultPayload: {},
    rowModelType: 'infinite',
    actions: [],
    externalActions: [],
  };
  public pageToLoad: any = '';
  public additionalData: any;
  public uploadedLookupData: any = {
    defaultColDef: {
      flex: 1,
      theme: 'ag-theme-alpine',
      editable: false,
      sortable: true,
      headerFontSize: 14,
      minWidth: 100,
      filter: true,
      resizable: true,
      rowIndexing: false,
      statusBar: true,
    },
    bodyContent: [],
    headerContent: [
      {
        field: 'lookup_value',
        key: 'lookup_value',
        headerName: 'Value',
      },
      {
        field: 'lookupdata_id',
        key: 'lookupdata_id',
        headerName: 'ID',
      },
      {
        field: 'category',
        key: 'category',
        headerName: 'Category',
      },
      {
        field: 'startTime',
        key: 'startTime',
        headerName: 'Start time',
      },
      {
        field: 'endTime',
        key: 'endTime',
        headerName: 'End time',
      },
      {
        field: 'status',
        key: 'status',
        headerName: 'Status',
      },
    ],
  };
  public csvUploadMetaData = {
    csvUploaded: false,
    csvUploadFile: undefined,
    fileSelectedToUpload: null,
    fileNameBlock: 'Choose file',
    isValid: false,
    selectedFile: undefined,
  };
  public meta: any = {
    show: false,
    currentDate: new Date(),
    searchIds: [],
    dateRange: [],
    moreInfo: [],
    taskHeaders: [],
    taskInfo: {},
    active_node: null,
    active_task_id: null,
    playGroundId: 'productPlayGround',
    id: null,
    searchBy: null,
    searchByOpt: [],
  };
  public editMode: boolean = false;
  public dfmData: any = { headerContent: [], bodyContent: {}, userActions: {} };
  public dfmComponentVisible: boolean = false;

  constructor(
    private http: HttpLayerService,
    public _route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public modalService: NgbModal,
    public toaster: ToastrService,
    public authService: AuthService,
    public _toastLoad : ToastrService,
  ) {

  }

  ngOnInit(): void {
    this.projectDetails = this.authService.getProjectDetails();
    this.productMasterData.defaultPayload.project_id =
      this.projectDetails['project_id'];
  }
  onBulkUploadTypeChange(event: any) {
    this.pageToLoad = event.value;
    this.additionalData = JSON.parse(event.schema);
    this.productMasterData.defaultPayload = {
      type: this.pageToLoad,
    };
    this.getHeader();
  }
  getHeader() {
    try {
      let payload: any = {};
      payload = {
        parent_name: '',
        type: this.pageToLoad,
        schema: this.additionalData.page_schema || '',
      };
      if (this.additionalData.page_type) {
        payload['pageType'] = this.additionalData.page_type;
      }
      this.productMasterData.columnDefs = [];
      const baseUrl = window.location.origin + '/ppm_translator/proxy';
      const url = baseUrl + '/' + payload.type + (payload['schema'] ? '?schema=' + payload['schema'] : '');
      this.http.getWithRequestJson(url,payload).subscribe({
        next: (resp: any) => {
          if (resp?.['status'] === 'success') {
            this.productMasterData.updateColDefs = resp.data?.updateColDefs;
            this.productMasterData.actions = resp.data?.actions;
            // this.productMasterData.externalActions = resp.data?.externalActions;
            this.productMasterData.externalActions.push({ btn_class: 'btn-icon', icon_class: 'p-0-1 py-2 btn download-icon fa icon-icons8-downloading-updates-100 upload-icon', type: 'button', action: 'upload' });
            this.productMasterData['hideExtActions'] = true;
            this.productMasterData.columnDefs = resp.data.columnDefs;
            
          } else {
            this.toaster.toast('error', 'Error', resp.message, true);
          }
        },
        error: (error: any) => {
          console.error(error);
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

    externalActionEmitter(event) {
        if (event.action === 'upload') {
            document.getElementById('uploadUnifiedFile').click();
        }
    }

  uploadUnifiedFile() {
    try {
      
      if (!this.csvUploadMetaData['isValid']) {
        this._toastLoad.toast('warning', 'Warning', 'The uploaded file is invalid.', true);
        return;
      }
      if (this.csvUploadMetaData['selectedFile']) {
        this.csvUploadMetaData['is_csv_invalid'] = false;
        const formData = new FormData();
        formData.append('type', this.pageToLoad);
        formData.append('template_data', this.csvUploadMetaData['selectedFile']);
        formData.append('project_id', this.projectDetails['project_id']);
        formData.append('tz', this.projectDetails['tz']);
        this.csvUploadMetaData['csvUploaded'] = true;
        const url = Config.API.BULK_UPLOAD_PPM;
        this.http.post(url, formData).pipe(takeUntil(this.destroy$)).subscribe((data:any) => {
          if (data.status === 'success') {
            this.uploadedLookupData['is_csv_invalid'] = data.data.is_csv_invalid;
            this.uploadedLookupData['bodyContent'] = data?.data.lookup_data || [];
            this.closeCSVUploadModel();
            this.uploadedLookupData = { ...this.uploadedLookupData };
            const ind = this.uploadedLookupData.headerContent.findIndex(e => e.headerName === 'Actions');
            
            document.getElementById('openuploadedPreviewModal').click();
            this.csvUploadMetaData['csvUploaded'] = false;
          }
          }, (CSVUploadErr) => {
            
            this.csvUploadMetaData['csvUploaded'] = false;
            this._toastLoad.toast('error', 'Error', CSVUploadErr.message || 'Error while uploading CSV', true);
          });
      }
    } catch (error) {
      
      console.error(error);
    }
  }
  closeCSVUploadModel() {
    try {
      const csvUploadModalToggler = document.getElementById('closeUnifiedUploadModal');
      csvUploadModalToggler.click();
    } catch (error) {
      console.error(error);
    }
  }
  downloadTemplate() {
    try {
      const url = Config.API.DOWNLOAD_LOOKUP_DATA + '?type=template' + '&ngsw-bypass=true';
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
    }
  }
  uploadBlockCsv(event) {
    try {
      this.csvUploadMetaData['isValid'] = false;
      const size = event.target.files[0].size / 1024 / 1024;
      if (size > 5) {
        this.csvUploadMetaData['isValid'] = false;
        this._toastLoad.toast('error', 'Maximum file size', 'Cannot upload files more than 5 MB.', true);
        return;
      }
      if (event.target['value']) {
        const fileList: FileList = event.target.files;
        const validExts = ['.xlsx', '.xls', '.csv'];
        let fileExt = JSON.parse(JSON.stringify(event.target['value']));
        fileExt = fileExt.substring(fileExt.lastIndexOf('.'));
        if (fileList.length > 0) {
          const file: File = fileList[0];
          if (validExts.indexOf(fileExt) > -1) {
            this.csvUploadMetaData['selectedFile'] = event.target.files[0];
            this.csvUploadMetaData['fileSelectedToUpload'] = event.target['value'].split('\\').pop();
            this.csvUploadMetaData['fileNameBlock'] = this.csvUploadMetaData['fileSelectedToUpload'];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            const current = this;
            current.csvUploadMetaData['isValid'] = true;
            reader.onload = function () {
              current.csvUploadMetaData['csvUploadFile'] = reader.result;
            };
            reader.onerror = function (error) {
              console.error('Error: ', error);
            };
          } else {
            this.csvUploadMetaData['isValid'] = false;
            this._toastLoad.toast('error', 'File type', 'Cannot upload files other than specified.', true);
          }
        } else {
          this.csvUploadMetaData['isValid'] = false;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  resetCSVUpload() {
    try {
      this.csvUploadMetaData['csvUploaded'] = false;
      this.csvUploadMetaData['fileNameBlock'] = 'Choose file';
      this.csvUploadMetaData['csvUploadFile'] = undefined;
      this.csvUploadMetaData['isValid'] = false;
      this.csvUploadMetaData['selectedFile'] = undefined;
    } catch (error) {
      console.error(error);
    }
  }

  onChangesEmitted(event) {
    try {
      if (event.field['hideFields']?.length && event['type'] === 'emitChanges') {
        const key = event['key'];
        const selectedValue = event['value'];
        this.dfmData['headerContent'][0]['data'] = this.dfmData['headerContent'][0]['data'].map((field) => {
          if (field['hideFields']?.length && field['hideFields'].includes(key)) {
            field.hidden = !!selectedValue;
            if (key !== field['key'] && field.hidden) {
              this.dfmData['bodyContent'][field['key']] = null;
            }
          }
          return field;
        });
        this.dfmData = { ...this.dfmData };
      }
    } catch (error) {
      console.error(error);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroy$.next(true);
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }

  closePreviewModal() {
    try {
      const csvUploadModalToggler = document.getElementById('closeuploadedPreviewModal');
      csvUploadModalToggler.click();
      this.resetCSVUpload();
      this.closeCSVUploadModel();
    } catch (error) {
      console.error(error);
    }
  }
  reUploadCSVFile() {
    try {
      document.getElementById('closeuploadedPreviewModal').click();
      this.resetCSVUpload();
      document.getElementById('uploadUnifiedFile').click();
    } catch (error) {
      console.error(error);
    }
  }
}
