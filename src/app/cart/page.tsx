"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    // Load cart from localStorage
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const removeFromCart = (id: number) => {
    const updated = cart.filter((p) => p.id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const total = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 gap-8">
      <header className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Link href="/">
          <button className="bg-gray-200 px-4 py-2 rounded">Back to Shop</button>
        </Link>
      </header>
      <div className="w-full max-w-xl flex flex-col gap-4">
        {cart.length === 0 ? (
          <div>Your cart is empty.</div>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {cart.map((product) => (
                <li key={product.id} className="flex justify-between items-center border rounded p-2">
                  <span>{product.name}</span>
                  <span>${product.price.toFixed(2)}</span>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => removeFromCart(product.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center mt-4">
              <span className="font-bold">Total:</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
            <Link href="/checkout">
              <button className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-4">Proceed to Checkout</button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
