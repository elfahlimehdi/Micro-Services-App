import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bill } from '../models/bill.interface';

@Injectable({
    providedIn: 'root'
})
export class BillingService {
    private apiUrl = 'http://localhost:8888/billing-service/bills';

    constructor(private http: HttpClient) {}

    getBills(): Observable<Bill[]> {
        return this.http.get<Bill[]>(this.apiUrl);
    }

    createBill(payload: { customerId: number; items: { productId: string; quantity: number }[] }): Observable<Bill> {
        return this.http.post<Bill>(this.apiUrl, payload);
    }

    deleteBill(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
