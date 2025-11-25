import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { BillingService } from '../../services/billing.service';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';
import { Bill } from '../../models/bill.interface';
import { Customer } from '../../models/customer.interface';
import { Product } from '../../models/product.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="page">
      <h2>Factures</h2>

      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>

      <div class="form-card">
        <h3>Nouvelle facture</h3>
        <div class="form-row">
          <label>Client</label>
          <select [(ngModel)]="newBill.customerId">
            <option [ngValue]="null">-- Choisir --</option>
            <option *ngFor="let c of customers" [ngValue]="c.id">{{ c.name }} ({{ c.email }})</option>
          </select>
        </div>

        <div class="items">
          <div *ngFor="let item of newBill.items; let i = index" class="item-row">
            <select [(ngModel)]="item.productId">
              <option [ngValue]="''">-- Produit --</option>
              <option *ngFor="let p of products" [ngValue]="p.id">{{ p.name }} - {{ p.price | currency:'EUR' }}</option>
            </select>
            <input type="number" min="1" [(ngModel)]="item.quantity" />
            <button mat-button color="warn" (click)="removeItem(i)" [disabled]="newBill.items.length === 1">Supprimer</button>
          </div>
          <button mat-stroked-button color="primary" (click)="addItem()">Ajouter un produit</button>
        </div>

        <div class="actions">
          <button mat-raised-button color="primary" (click)="createBill()" [disabled]="!canSubmit()">Créer la facture</button>
        </div>
      </div>

      <table mat-table [dataSource]="bills" class="mat-elevation-z8">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let bill">{{ bill.id }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let bill">{{ bill.billingDate | date:'short' }}</td>
        </ng-container>

        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef>Client</th>
          <td mat-cell *matCellDef="let bill">{{ bill.customer?.name || bill.customerId }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let bill">{{ getTotal(bill) | currency:'EUR' }}</td>
        </ng-container>

        <ng-container matColumnDef="items">
          <th mat-header-cell *matHeaderCellDef>Produits</th>
          <td mat-cell *matCellDef="let bill">
            <div class="items-list">
              <div *ngFor="let item of bill.productItems">
                {{ item.product?.name || item.productId }} — {{ item.quantity }} x {{ item.unitPrice | currency:'EUR' }}
              </div>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="actions-header">
            <mat-icon aria-hidden="true">more_horiz</mat-icon>
          </th>
          <td mat-cell *matCellDef="let bill">
            <button mat-icon-button color="primary" matTooltip="Editer (bientôt)" aria-label="Editer">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteBill(bill.id)" matTooltip="Supprimer" aria-label="Supprimer">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="bill-row"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page { padding: 20px; }
    table { width: 100%; }
    .error { color: red; margin-bottom: 10px; }
    .form-card { background: #f7f7f7; padding: 16px; margin-bottom: 20px; border-radius: 8px; }
    .form-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
    .items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .item-row { display: flex; gap: 8px; align-items: center; }
    select, input { padding: 6px; min-width: 180px; }
    .actions { margin-top: 10px; }
    .actions-header { text-align: center; width: 80px; }
  `]
})
export class BillsComponent implements OnInit {
  bills: Bill[] = [];
  displayedColumns: string[] = ['id', 'date', 'customer', 'total', 'items', 'actions'];
  errorMessage = '';
  customers: Customer[] = [];
  products: Product[] = [];
  newBill: { customerId: number | null; items: { productId: string; quantity: number }[] } = {
    customerId: null,
    items: [{ productId: '', quantity: 1 }]
  };

  constructor(
    private billingService: BillingService,
    private customerService: CustomerService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadBills();
    this.customerService.getCustomers().subscribe({
      next: data => this.customers = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des clients'
    });
    this.productService.getProducts().subscribe({
      next: data => this.products = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des produits'
    });
  }

  getTotal(bill: Bill): number {
    return bill.productItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
  }

  addItem(): void {
    this.newBill.items.push({ productId: '', quantity: 1 });
  }

  removeItem(index: number): void {
    if (this.newBill.items.length > 1) {
      this.newBill.items.splice(index, 1);
    }
  }

  canSubmit(): boolean {
    return !!this.newBill.customerId &&
      this.newBill.items.every(i => i.productId && i.quantity > 0);
  }

  createBill(): void {
    if (!this.canSubmit()) {
      this.errorMessage = 'Veuillez sélectionner un client et au moins un produit avec quantité valide.';
      return;
    }
    this.errorMessage = '';
    this.billingService.createBill({
      customerId: this.newBill.customerId!,
      items: this.newBill.items
    }).subscribe({
      next: bill => {
        this.bills = [bill, ...this.bills];
        this.newBill = { customerId: null, items: [{ productId: '', quantity: 1 }] };
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la création de la facture';
      }
    });
  }

  private loadBills(): void {
    this.billingService.getBills().subscribe({
      next: data => this.bills = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des factures'
    });
  }

  deleteBill(id: number): void {
    this.billingService.deleteBill(id).subscribe({
      next: () => {
        this.bills = this.bills.filter(b => b.id !== id);
      },
      error: () => this.errorMessage = 'Erreur lors de la suppression de la facture'
    });
  }
}
