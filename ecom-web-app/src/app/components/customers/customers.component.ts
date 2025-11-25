import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.interface';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule],
  template: `
    <div class="page">
      <h2>Clients</h2>

      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>

      <div class="form-card">
        <h3>Ajouter un client</h3>
        <div class="form-row">
          <label>Nom</label>
          <input [(ngModel)]="newCustomer.name" placeholder="Nom" />
        </div>
        <div class="form-row">
          <label>Email</label>
          <input [(ngModel)]="newCustomer.email" placeholder="Email" />
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="createCustomer()" [disabled]="!canSubmit()">Ajouter</button>
        </div>
      </div>

      <table mat-table [dataSource]="customers" class="mat-elevation-z8">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let customer">{{ customer.id }}</td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nom</th>
          <td mat-cell *matCellDef="let customer">{{ customer.name }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let customer">{{ customer.email }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page { padding: 20px; }
    table { width: 100%; }
    .error { color: red; margin-bottom: 10px; }
    .form-card { background: #f7f7f7; padding: 16px; margin-bottom: 20px; border-radius: 8px; }
    .form-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
    .form-row label { width: 60px; }
    input { padding: 6px; flex: 1; }
  `]
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  displayedColumns: string[] = ['id', 'name', 'email'];
  errorMessage = '';
  newCustomer: { name: string; email: string } = { name: '', email: '' };

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe({
      next: data => this.customers = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des clients'
    });
  }

  canSubmit(): boolean {
    return !!this.newCustomer.name && !!this.newCustomer.email;
  }

  createCustomer(): void {
    if (!this.canSubmit()) {
      this.errorMessage = 'Nom et email obligatoires';
      return;
    }
    this.errorMessage = '';
    this.customerService.createCustomer(this.newCustomer).subscribe({
      next: customer => {
        this.customers = [customer, ...this.customers];
        this.newCustomer = { name: '', email: '' };
      },
      error: () => this.errorMessage = 'Erreur lors de la creation du client'
    });
  }
}
