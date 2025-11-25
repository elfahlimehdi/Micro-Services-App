import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [MatToolbarModule, MatButtonModule, RouterLink],
    template: `
    <mat-toolbar color="primary">
      <span>E-Commerce App</span>
      <span class="spacer"></span>
      <button mat-button routerLink="/">Accueil</button>
      <button mat-button routerLink="/products">Produits</button>
      <button mat-button routerLink="/customers">Clients</button>
      <button mat-button routerLink="/bills">Factures</button>
    </mat-toolbar>
  `,
    styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class NavbarComponent { }
