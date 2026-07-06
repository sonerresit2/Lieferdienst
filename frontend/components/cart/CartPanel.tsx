"use client";

import { useState } from "react";
import styles from "./CartPanel.module.css";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getImageSrc(imagePath: string) {
  return imagePath.startsWith("http") ? imagePath : `${API_URL}${imagePath}`;
}

interface Props { onClose: () => void; }

export default function CartPanel({ onClose }: Props) {
  const { user } = useAuth();
  const { cart, isLoading, error: cartError, updateItem, removeItem, doCheckout } = useCart();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  async function handleCheckout() {
    setMessage(null);
    setLoading(true);
    try {
      const order = await doCheckout();
      setMessage({ text: `Bestellt! Gesamt: ${formatPrice(order.total_price)}`, success: true });
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error

