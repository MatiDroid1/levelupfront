import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { adminGuard } from './guards/admin.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
    title: 'Inicio · LevelUp Gamer',
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./pages/catalogo/catalogo').then(m => m.Catalogo),
    title: 'Catálogo · LevelUp Gamer',
  },
  {
    path: 'carrito',
    loadComponent: () =>
      import('./pages/carrito/carrito').then(m => m.Carrito),
    title: 'Carrito · LevelUp Gamer',
    canActivate: [MsalGuard],
  },
  {
    path: 'pedidos',
    loadComponent: () =>
      import('./pages/pedidos/pedidos').then(m => m.Pedidos),
    title: 'Mis pedidos · LevelUp Gamer',
    canActivate: [MsalGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin').then(m => m.Admin),
    title: 'Administración · LevelUp Gamer',
    canActivate: [MsalGuard, adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];