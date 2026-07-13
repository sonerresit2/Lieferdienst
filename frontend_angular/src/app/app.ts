import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    Navbar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}