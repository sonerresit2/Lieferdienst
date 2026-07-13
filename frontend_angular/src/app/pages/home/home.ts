import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // Vom Backend geladene Produkte
  products: Product[] = [];

  // Für die Anzeige verwendete Produkte
  filteredProducts: Product[] = [];

  // Anbieter
  vendors: Vendor[] = [];

  // Aktuell ausgewählter Anbieter
  selectedVendor: number | null = null;

  // Aktuell ausgewählte Kategorie
  selectedCategory: string | null = null;

  constructor(
    private productService: ProductService,
    private vendorService: VendorService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Produkte und Anbieter laden
   */
  ngOnInit(): void {

    console.log('HOME GELADEN');

    forkJoin([
      this.productService.getProducts(),
      this.vendorService.getVendors()
    ]).subscribe({

      next: ([products, vendors]) => {

        console.log('Produkte:', products);
        console.log('Anbieter:', vendors);

        this.products = products;
        this.filteredProducts = [...products];
        this.vendors = vendors;

        this.cdr.detectChanges();


        console.log(
          'Products State:',
          this.products.length
        );

        console.log(
          'Filtered State:',
          this.filteredProducts.length
        );

        console.log(
          'Vendor State:',
          this.vendors.length
        );

      },

      error: (error) => {

        console.error(
          'Fehler beim Laden:',
          error
        );

      }

    });

  }


  /**
 * Wendet alle aktiven Filter an.
 */
private applyFilters(): void {

  let filtered = [...this.products];

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

  this.filteredProducts = filtered;

}
  /**
   * Kategorien aus allen Produkten erzeugen
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
 * Filtert Produkte nach Anbieter.
 */
filterByVendor(
  vendorId: number | null
): void {

  this.selectedVendor = vendorId;

  this.applyFilters();

}

/**
 * Filtert Produkte nach Kategorie.
 */
filterByCategory(
  category: string | null
): void {

  this.selectedCategory = category;

  this.applyFilters();

}
}