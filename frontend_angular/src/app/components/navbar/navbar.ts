import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [
  RouterLink
],
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  toggleTheme() {

    document.body.classList.toggle('dark');

  }

}