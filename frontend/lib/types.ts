// Spiegelt die Pydantic-Schemas des Backends (app/schemas/) wider.

export interface ProductImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  vendor_id: number;
  name: string;
  description: string | null;
  price: string; // Decimal kommt als String vom Backend
  category: string | null;
  is_available: boolean;
  images: ProductImage[];
}

export interface Vendor {
  id: number;
  name: string;
  description: string | null;
  rating: string | null;
  delivery_fee: string;
  delivery_time_min: number | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  product: Product;
}

export interface Order {
  id: number;
  vendor_id: number;
  status: string;
  total_price: string;
  items: OrderItem[];
}

export interface Token {
  access_token: string;
  token_type: string;
}
