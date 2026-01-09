// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Dashboard } from './modules/dashboard/dashboard';
import { Customers } from './modules/customers/customers';

import { Inventory } from './modules/inventory/inventory';
import { Sales } from './modules/sales/sales';
import { Login } from './modules/login/login';
import { Register } from './modules/register/register';
import { AuthGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'customers', component: Customers, canActivate: [AuthGuard] },
  { path: 'inventory', component: Inventory, canActivate: [AuthGuard] },
  { path: 'sales', component: Sales, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' } 
];


