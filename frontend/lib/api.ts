import type { Cart, Order, Product, Token, User, Vendor } from "./types";

// Im Browser: http://localhost:8000 (Backend läuft außerhalb des Docker-Netzwerks,
// daher immer localhost, nicht der Docker-Servicename "backend").
// Server-seitig (Next.js Server Components / Route Handlers): http://backend:8000
// Die Umgebungsvariable NEXT_PUBLIC_ ist auch im Browser verfügbar.
const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : process.env.API_URL_INTERNAL ?? "http://backend:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lieferdienst_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.detail ?? `Fehler ${res.status}`
    );
  }

  return data as T;
}

// ---- Anbieter ----

export async function getVendors(): Promise<Vendor[]> {
  return request<Vendor[]>("/vendors");
}

// ---- Produkte ----

export async function getProducts(params: {
  vendorId?: number;
  category?: string;
} = {}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params.vendorId) qs.set("vendor_id", String(params.vendorId));
  if (params.category) qs.set("category", params.category);
  const query = qs.toString() ? `?${qs}` : "";
  return request<Product[]>(`/products${query}`);
}

// ---- Auth ----

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
}): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  return request<Token>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me", {}, true);
}

// ---- Warenkorb ----

export async function getCart(): Promise<Cart> {
  return request<Cart>("/cart", {}, true);
}

export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  return request<Cart>(
    "/cart/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    },
    true
  );
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return request<Cart>(
    `/cart/items/${itemId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
    true
  );
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  return request<Cart>(`/cart/items/${itemId}`, { method: "DELETE" }, true);
}

// ---- Bestellungen ----

export async function checkout(): Promise<Order> {
  return request<Order>("/orders/checkout", { method: "POST" }, true);
}
