import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      // TODO Fase 1: ruta /projects (CRUD de proyectos)
      { path: 'projects', pathMatch: 'full', redirectTo: '' },
      // TODO Fase 2: ruta /editor (editor de bloques)
      { path: 'editor', pathMatch: 'full', redirectTo: '' },
      // TODO Fase 3: vista pública /u/:username (sin guard)
    ],
  },
  { path: '**', redirectTo: '' },
];
