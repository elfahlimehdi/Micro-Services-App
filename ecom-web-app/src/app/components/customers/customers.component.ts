import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.interface';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  template: `
    <div class="page">
      <h2>Clients</h2>

      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>

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
  `]
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  displayedColumns: string[] = ['id', 'name', 'email'];
  errorMessage = '';

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.customerService.getCustomers().subscribe({
      next: data => this.customers = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des clients'
    });
  }
}
