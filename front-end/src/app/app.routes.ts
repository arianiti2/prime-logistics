import { Routes } from '@angular/router';
import { Dashboard } from './modules/dashboard/dashboard';
import { Customers } from './modules/customers/customers';
import { Inventory } from './modules/inventory/inventory';
import { Sales } from './modules/sales/sales';
import { Login } from './modules/login/login';

export const routes: Routes = [
  { path: '', component: Dashboard},
  { path: 'customers', component: Customers },
  { path: 'inventory', component: Inventory},
  { path: 'sales', component: Sales },
  { path: 'login', component: Login },
  { path: '**', redirectTo: '' }
];
