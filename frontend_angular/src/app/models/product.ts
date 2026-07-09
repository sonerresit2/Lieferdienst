export interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  vendor_id: number;

  name: string;
  description: string;

  price: string;

  category: string;

  is_available: boolean;

  dietary_tags: string[];

  images: ProductImage[];
}