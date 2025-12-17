import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale } from '../core/models/sale';
import { environment } from '../environment/environment';
@Injectable({ providedIn: 'root' })
export class SalesService {
  private baseUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.baseUrl);
  }

  create(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, sale);
  }

  getById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${id}`);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
