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
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects').then((m) => m.ProjectsComponent),
      },
      {
        path: 'editor',
        loadComponent: () => import('./features/editor/editor').then((m) => m.EditorComponent),
      },
    ],
  },
  {
    path: 'u/:username',
    loadComponent: () =>
      import('./features/public-portfolio/public-portfolio').then(
        (m) => m.PublicPortfolioComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
