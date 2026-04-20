import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'vehicles',
    loadComponent: () => import('./vehicles/vehicles.component').then(m => m.VehiclesComponent)
  },
  {
    path: 'parking-slots',
    loadComponent: () => import('./parking-slots/parking-slots.component').then(m => m.ParkingSlotsComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
