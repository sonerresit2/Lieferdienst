"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as api from "@/lib/api";
import type { Cart } from "@/lib/types";
import { useAuth } from "./auth-context";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  addToCart: (productId: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  doCheckout: () => Promise<{ total_price: string }>;
  reload: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  itemCount: 0,
  addToCart: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  doCheckout: async () => ({ total_price: "0" }),
  reload: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);

  const reload = useCallback(async () => {
    if (!user) { setCart(null); return; }
    try {
      setCart(await api.getCart());
    } catch {
      setCart(null);
    }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const addToCart = useCallback(async (productId: number) => {
    setCart(await api.addToCart(productId));
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(await api.removeCartItem(itemId));
    } else {
      setCart(await api.updateCartItem(itemId, quantity));
    }
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    setCart(await api.removeCartItem(itemId));
  }, []);

  const doCheckout = useCallback(async () => {
    const order = await api.checkout();
    await reload();
    return order;
  }, [reload]);

  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, addToCart, updateItem, removeItem, doCheckout, reload }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
