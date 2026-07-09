import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { ReviewsProvider } from "@/lib/reviews-context";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";

export const metadata: Metadata = {
  title: "Lieferdienst — Speisekarte",
  description: "Food-Delivery-Plattform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <AuthProvider>
          <CartProvider>
            <ReviewsProvider>
              <Header />
              {children}
              <Footer />
              <CookieBanner />
            </ReviewsProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
