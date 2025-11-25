import { Product } from './product.interface';

export interface ProductItem {
    id: number;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: Product;
}

export interface Bill {
    id: number;
    billingDate: string;
    customerId: number;
    customer?: {
        id: number;
        name: string;
        email: string;
    };
    productItems: ProductItem[];
}
