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

}