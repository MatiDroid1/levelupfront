import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home),
    title: 'Inicio · LevelUp Gamer',
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./pages/catalogo/catalogo').then(m => m.Catalogo),
    title: 'Catálogo · LevelUp Gamer',
  },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/carrito/carrito').then(m => m.Carrito),
    title: 'Carrito · LevelUp Gamer',
    canActivate: [MsalGuard],
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos').then(m => m.Pedidos),
    title: 'Mis pedidos · LevelUp Gamer',
    canActivate: [MsalGuard],
  },
  { path: '**', redirectTo: '' },
];