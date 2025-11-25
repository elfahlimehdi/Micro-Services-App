import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.interface';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    // Gateway route to the inventory service (Spring Data REST base path is /api)
    private apiUrl = 'http://localhost:8888/inventory-service/api/products';

    constructor(private http: HttpClient) { }

    getProducts(): Observable<Product[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                // Handle Spring Data REST HAL format
                if (response._embedded && response._embedded.products) {
                    return response._embedded.products;
                }
                return response;
            })
        );
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    createProduct(product: Product): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product);
    }

    updateProduct(id: string, product: Product): Observable<Product> {
        return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
    }

    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

