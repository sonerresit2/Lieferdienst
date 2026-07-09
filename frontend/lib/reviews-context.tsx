"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as api from "@/lib/api";
import type { Order, Review } from "@/lib/types";
import { useAuth } from "./auth-context";

interface ReviewsContextValue {
  isLoading: boolean;
  canReviewVendor: (vendorId: number) => boolean;
  canReviewProduct: (productId: number) => boolean;
  myVendorReview: (vendorId: number) => Review | undefined;
  myProductReview: (productId: number) => Review | undefined;
  submitVendorReview: (vendorId: number, rating: number, comment?: string) => Promise<void>;
  submitProductReview: (productId: number, rating: number, comment?: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextValue>({
  isLoading: false,
  canReviewVendor: () => false,
  canReviewProduct: () => false,
  myVendorReview: () => undefined,
  myProductReview: () => undefined,
  submitVendorReview: async () => {},
  submitProductReview: async () => {},
});

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setReviews([]);
      return;
    }
    setIsLoading(true);
    try {
      const [o, r] = await Promise.all([api.getMyOrders(), api.getMyReviews()]);
      setOrders(o);
      setReviews(r);
    } catch {
      // Stiller Fehlschlag: Bewerten-Buttons bleiben dann einfach ausgeblendet.
      setOrders([]);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const orderedVendorIds = useMemo(
    () => new Set(orders.map((o) => o.vendor_id)),
    [orders]
  );
  const orderedProductIds = useMemo(
    () => new Set(orders.flatMap((o) => o.items.map((i) => i.product_id))),
    [orders]
  );

  const canReviewVendor = useCallback(
    (vendorId: number) => orderedVendorIds.has(vendorId),
    [orderedVendorIds]
  );
  const canReviewProduct = useCallback(
    (productId: number) => orderedProductIds.has(productId),
    [orderedProductIds]
  );

  const myVendorReview = useCallback(
    (vendorId: number) => reviews.find((r) => r.vendor_id === vendorId),
    [reviews]
  );
  const myProductReview = useCallback(
    (productId: number) => reviews.find((r) => r.product_id === productId),
    [reviews]
  );

  const submitVendorReview = useCallback(
    async (vendorId: number, rating: number, comment?: string) => {
      const review = await api.submitReview({ vendorId, rating, comment });
      setReviews((prev) => [...prev.filter((r) => r.vendor_id !== vendorId), review]);
    },
    []
  );

  const submitProductReview = useCallback(
    async (productId: number, rating: number, comment?: string) => {
      const review = await api.submitReview({ productId, rating, comment });
      setReviews((prev) => [...prev.filter((r) => r.product_id !== productId), review]);
    },
    []
  );

  return (
    <ReviewsContext.Provider
      value={{
        isLoading,
        canReviewVendor,
        canReviewProduct,
        myVendorReview,
        myProductReview,
        submitVendorReview,
        submitProductReview,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  return useContext(ReviewsContext);
}
