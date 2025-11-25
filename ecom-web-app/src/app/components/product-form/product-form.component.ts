import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  template: `
    <div class="container">
      <h2>{{ isEditMode ? 'Modifier le produit' : 'Ajouter un nouveau produit' }}</h2>
      
      <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nom du produit</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Laptop">
          <mat-error *ngIf="productForm.get('name')?.hasError('required')">
            Le nom est requis
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Prix</mat-label>
          <input matInput type="number" formControlName="price" placeholder="0.00">
          <mat-error *ngIf="productForm.get('price')?.hasError('required')">
            Le prix est requis
          </mat-error>
          <mat-error *ngIf="productForm.get('price')?.hasError('min')">
            Le prix doit être positif
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Quantité</mat-label>
          <input matInput type="number" formControlName="quantity" placeholder="0">
          <mat-error *ngIf="productForm.get('quantity')?.hasError('required')">
            La quantité est requise
          </mat-error>
          <mat-error *ngIf="productForm.get('quantity')?.hasError('min')">
            La quantité doit être positive
          </mat-error>
        </mat-form-field>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid">
            {{ isEditMode ? 'Mettre à jour' : 'Créer' }}
          </button>
          <button mat-button type="button" routerLink="/products">Annuler</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .container { max-width: 600px; margin: 20px auto; padding: 20px; }
    .full-width { width: 100%; margin-bottom: 15px; }
    .actions { display: flex; gap: 10px; margin-top: 20px; }
  `]
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId?: string;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = id;
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: string): void {
    this.productService.getProduct(id).subscribe(product => {
      this.productForm.patchValue(product);
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const product = this.productForm.value;

      if (this.isEditMode && this.productId) {
        this.productService.updateProduct(this.productId, product).subscribe(() => {
          this.router.navigate(['/products']);
        });
      } else {
        this.productService.createProduct(product).subscribe(() => {
          this.router.navigate(['/products']);
        });
      }
    }
  }
}
