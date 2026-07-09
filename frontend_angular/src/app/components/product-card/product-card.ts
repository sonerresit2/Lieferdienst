import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Product } from '../../models/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {

  @Input()
  product!: Product;

  get imageUrl(): string | null {

    const image =
      this.product.images?.find(
        i => i.is_primary
      ) ??
      this.product.images?.[0];

    if (!image) {
      return null;
    }

    return `http://localhost:8000${image.image_path}`;
  }

}