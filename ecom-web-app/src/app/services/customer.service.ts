import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Customer } from '../models/customer.interface';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private apiUrl = 'http://localhost:8888/customer-service/api/customers';

    constructor(private http: HttpClient) {}

    getCustomers(): Observable<Customer[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                if (response._embedded && response._embedded.customers) {
                    return response._embedded.customers;
                }
                return response;
            })
        );
    }
}
