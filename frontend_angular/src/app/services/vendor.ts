import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Vendor } from '../models/vendor';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  private apiUrl =
    'http://localhost:8000/vendors';

  constructor(
    private http: HttpClient
  ) {}

  getVendors(): Observable<Vendor[]> {

    return this.http.get<Vendor[]>(
      this.apiUrl
    );

  }

}