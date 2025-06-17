"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Define a Product type
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);

  // Sync cart with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Simulate AI response
  const handleSend = () => {
    if (!input.trim()) return;
    setProducts([
      {
        id: 1,
        name: "Sample Product 1",
        price: 19.99,
        imageUrl: "https://images.unsplash.com/photo-1513708927688-890a1e2b6b94?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: 2,
        name: "Sample Product 2",
        price: 29.99,
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      },
    ]);
    setInput("");
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")'}} />
      <header className="w-full max-w-3xl mx-auto flex justify-between items-center py-6 px-4 z-10">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight drop-shadow-lg">LLM Market</h1>
        <Link href="/cart" className="relative">
          <button className="bg-white/20 backdrop-blur border border-white/30 text-white px-5 py-2 rounded-full shadow-lg hover:bg-white/30 transition font-semibold">
            Cart ({cart.length})
          </button>
        </Link>
      </header>
      <main className="flex-1 w-full flex flex-col items-center justify-center z-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 p-6 rounded-3xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 mt-8">
          {/* Products above chat */}
          {products.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-white/90">AI Suggestions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white/80 rounded-2xl p-6 flex flex-col gap-3 shadow-lg border border-white/40 hover:scale-[1.03] transition-transform">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover rounded-xl shadow mb-2" />
                    <div className="font-semibold text-lg text-gray-900">{product.name}</div>
                    <div className="text-blue-700 text-xl font-bold">${product.price.toFixed(2)}</div>
                    <button
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition"
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Chat input only */}
          <form
            className="flex items-end gap-3 mt-2"
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex-1 relative">
              <input
                className="w-full bg-white/80 border border-white/40 rounded-2xl py-4 px-5 pr-16 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 text-lg placeholder:text-gray-400"
                placeholder="Describe what you want..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-2 shadow hover:from-blue-600 hover:to-purple-600 transition"
                aria-label="Send"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
