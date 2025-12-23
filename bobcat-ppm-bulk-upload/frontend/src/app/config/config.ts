import { environment } from '../../environments/environment';


export class Config {
    // private static get API_END_POINT(): string { return '/gateway/plugin/project-104/logbook-report-page-copy/api/LogReport/'; }
    private static get API_END_POINT(): string { return '/salesforce_service/'; }
    private static get REPORT_END_POINT(): string { return '/ebpr_reports/'; }
    public static SERVICE_IDENTIFIER = {
        GET_FILTERS: Config.API_END_POINT + 'FetchDropdownValues',
        GENERATE_REPORTS : Config.API_END_POINT + 'GenerateReport',
        CUSTOM_PGP_REPORT: Config.REPORT_END_POINT + 'reports/generate',
        DEFINE_PGP_REPORT: Config.REPORT_END_POINT + 'define_reports/list',

    }
    public static API = {
        GET_BATCH_PROCESS_HEADER: Config.API_END_POINT + 'GetBatchProcessHeader',
        BULK_UPLOAD_PPM: Config.API_END_POINT + 'BulkUploadPPM',
        DOWNLOAD_LOOKUP_DATA : Config.API_END_POINT + 'DownloadLookupData',
    }
    // public static CONSTANTS = {
    // }
}