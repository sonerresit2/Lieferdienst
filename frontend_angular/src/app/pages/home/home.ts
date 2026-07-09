import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductCard } from '../../components/product-card/product-card';

import { Product } from '../../models/product';
import { Vendor } from '../../models/vendor';

import { ProductService } from '../../services/product';
import { VendorService } from '../../services/vendor';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ProductCard
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  // Alle geladenen Produkte
  products: Product[] = [];

  // Alle verfügbaren Anbieter
  vendors: Vendor[] = [];

  // Aktuell ausgewählter Anbieter
  selectedVendor: number | null = null;

  // Aktuell ausgewählte Kategorie
  selectedCategory: string | null = null;

  constructor(
    private productService: ProductService,
    private vendorService: VendorService
  ) {}

  /**
   * Wird beim Laden der Startseite ausgeführt.
   * Lädt Produkte und Anbieter parallel vom Backend.
   */
  ngOnInit(): void {

    forkJoin([
      this.productService.getProducts(),
      this.vendorService.getVendors()
    ])
    .subscribe({

      next: ([products, vendors]) => {

        this.products = products;
        this.vendors = vendors;

      },

      error: (error) => {

        console.error(
          'Fehler beim Laden der Daten:',
          error
        );

      }

    });

  }

  /**
   * Erstellt automatisch eine Liste aller Kategorien,
   * die in den Produkten vorhanden sind.
   */
  get categories(): string[] {

    return [
      ...new Set(
        this.products.map(
          product => product.category
        )
      )
    ];

  }

  /**
   * Filtert die Produkte abhängig
   * vom ausgewählten Anbieter
   * und der ausgewählten Kategorie.
   */
  get filteredProducts(): Product[] {

    let filtered = this.products;

    // Anbieterfilter
    if (this.selectedVendor !== null) {

      filtered = filtered.filter(
        product =>
          product.vendor_id === this.selectedVendor
      );

    }

    // Kategoriefilter
    if (this.selectedCategory !== null) {

      filtered = filtered.filter(
        product =>
          product.category === this.selectedCategory
      );

    }

    return filtered;

  }

}