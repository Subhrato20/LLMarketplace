"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 gap-8">
      <header className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link href="/cart">
          <button className="bg-gray-200 px-4 py-2 rounded">Back to Cart</button>
        </Link>
      </header>
      <div className="w-full max-w-xl flex flex-col gap-4">
        <h2 className="font-bold mb-2">Order Summary</h2>
        <ul className="flex flex-col gap-2">
          {cart.map((product) => (
            <li key={product.id} className="flex justify-between items-center border rounded p-2">
              <span>{product.name}</span>
              <span>${product.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-4">
          <span className="font-bold">Total:</span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </div>
        <div className="mt-8 p-4 border rounded bg-gray-50 text-center">
          <p className="mb-2">Payment and shipping coming soon!</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded" disabled>
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
