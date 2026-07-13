import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Impressum } from './pages/impressum/impressum';
import { Datenschutz } from './pages/datenschutz/datenschutz';
import { Agb } from './pages/agb/agb';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'impressum',
    component: Impressum
  },
  {
    path: 'datenschutz',
    component: Datenschutz
  },
  {
    path: 'agb',
    component: Agb
  }
];