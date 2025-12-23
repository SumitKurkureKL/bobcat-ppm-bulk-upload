import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { catchError, finalize, tap, timeout } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { AuthService } from './auth.service';
@Injectable({
    providedIn: 'root'
})

export class HttpLayerService {
    constructor(
        private http: HttpClient,public _auth:AuthService
    ) { }

    httpHeaders: any = new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT',
        'Access-Control-Allow-Headers': "Content-Type, x-requested-with"
    });

    public responseData: any;
    public waste = {
        k: '',
        li: '',
        Lens: '',
        KLiL: '',
        e: '',
        nsK: '',
        L: '',
    };
    detectContentType(method: any, url: any, data:any ) {
        const req = new HttpRequest(method, url, data);
        return req.detectContentTypeHeader();
    }

   base64url(source: any): string {
    let encodedSource = CryptoJS.enc.Base64.stringify(source);
    encodedSource = encodedSource.replace(/={1,2}$/, '');
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');
    
    return encodedSource;
}

    getSignedToken(payload: any): string | undefined {
        try {
            const secretKey = Object.keys(this.waste).join('');
            const header = {
                alg: 'HS256',
                typ: 'JWT',
            };
            const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
            const encodedHeader = this.base64url(stringifiedHeader);
            const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(payload));
            const encodedData = this.base64url(stringifiedData);
            const token = encodedHeader + '.' + encodedData;
            let signature: any = CryptoJS.HmacSHA256(token, secretKey);
            signature = this.base64url(signature);
            return token + '.' + signature;
        } catch (e) {
          console.error(e);
          return undefined;
        }
    }


    post(url: any, data: any) {
      const projectDetails:any = this._auth.getProjectDetails();
      const userDetails:any  = this._auth.getUserDetails();
      data['project_type'] = data.project_type || projectDetails['project_type'];
      data['tz'] ??= projectDetails['tz'];
      data['project_id'] = projectDetails?.project_id;
      data['language'] = localStorage.getItem('lang') || 'en';
      data['user_id'] ??= userDetails?.user_id;
        return this.http.post(url, data, { headers: this.httpHeaders });
    }
    getRequest(url: any) {
        return this.http.get(url, { headers: this.httpHeaders });
    }

    postRequest(url: any, data: any) {
      const projectDetails:any = this._auth.getProjectDetails();
      const userDetails:any  = this._auth.getUserDetails();
      data['project_type'] = data.project_type || projectDetails['project_type'];
      data['tz'] ??= projectDetails['tz'];
      data['project_id'] = projectDetails?.project_id;
      data['language'] = localStorage.getItem('lang') || 'en';
      data['user_id'] ??= userDetails?.user_id;
        return this.http.post(url, this.getSignedToken(data), { headers: this.httpHeaders })
        .pipe(
            tap((res: any) => {
                this.responseData = res;
            }), catchError(error => {
                return throwError('Something went wrong!');
            })
        )
    }

    getWithRequestJson(url: string, options?: any){
    try {
      let urlWithParams;
      if (options) {
        const urlSegment = url.split('?');
        if (urlSegment.length > 1 && urlSegment[1] !== '') {
          urlWithParams = `${url}&params=${this.jsontoURLSearchParam(options)}`;
        } else {
          urlWithParams = `${url}?params=${this.jsontoURLSearchParam(options)}`;
        }
      }
      return this.getRequest(urlWithParams)
        .pipe(catchError((error) => {
          return throwError(error);
        }))
        .pipe(timeout(300000));
    } catch (error) {
      console.error(error);
      return throwError(error);
    }
  }
    jsontoURLSearchParam(jsonObject) {
      const projectDetails: any = this._auth.getProjectDetails();
    jsonObject['project_type'] = jsonObject.project_type || projectDetails['project_type'];
    jsonObject['tz'] = jsonObject.tz || (projectDetails?.tz);
    jsonObject['project_id'] = projectDetails['project_id'];
    jsonObject['language'] = localStorage.getItem('lang') || 'en';
    jsonObject['user_id'] = this._auth.getUserDetails().user_id;
    const objectSorter = (orgFormat: { [key: string]: any }) => 
      Object.keys(orgFormat)
        .sort((a, b) => {
          const aNum = parseFloat(a);
          const bNum = parseFloat(b);
          if (aNum && bNum) {
            /** Both keys are numbers */
            return aNum - bNum;
          } else if (aNum && !bNum) {
            /** a is a number, b is a string */
            return -1;
          } else if (!aNum && bNum) {
            /** a is a string, b is a number */
            return 1;
          } else {
            /** Both keys are strings */
            return a.localeCompare(b);
          }
        }).reduce((finalObject: { [key: string]: any }, key) => {
          finalObject[key] = orgFormat[key];
          return finalObject;
        }, {});
    const stringifiedJson = JSON.stringify(objectSorter(jsonObject));
    return  encodeURIComponent(stringifiedJson).toString();
  }

  frameRequiredKeys(payload = {}) {
    try {
      const projectDetails: any = this._auth.getProjectDetails();
      payload['tz'] = projectDetails?.tz;
      payload['project_id'] = projectDetails['project_id'];
      payload['language'] = localStorage.getItem('lang') || 'en';
      payload['user_id'] = this._auth.getUserDetails().user_id;
      return payload;
    } catch (error) {
      console.error(error);
      return payload;
    }
  }
}
