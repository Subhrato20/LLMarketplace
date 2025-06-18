"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Define a Product type
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  asin?: string;
  link?: string;
  rating?: number;
  reviews_count?: number;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all products from API
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]); // Only 2 products to display
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync cart with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Search for products using the API
  const handleSend = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm: input }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const products = data.products || [];
        setAllProducts(products);
        setVisibleProducts(products.slice(0, 2)); // Show first 2 products
      } else {
        console.error('API Error:', data.error);
        // Fallback to mock data on error
        const fallbackProducts = [
          {
            id: 1,
            name: "Sample Product 1",
            price: 19.99,
            imageUrl: "https://images.unsplash.com/photo-1513708927688-890a1e2b6b94?auto=format&fit=crop&w=400&q=80",
          }
        ];
        setAllProducts(fallbackProducts);
        setVisibleProducts(fallbackProducts);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      // Fallback to mock data on error
      const fallbackProducts = [
        {
          id: 1,
          name: "Sample Product 1",
          price: 19.99,
          imageUrl: "https://images.unsplash.com/photo-1513708927688-890a1e2b6b94?auto=format&fit=crop&w=400&q=80",
        }
      ];
      setAllProducts(fallbackProducts);
      setVisibleProducts(fallbackProducts);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const removeProduct = (productId: number) => {
    // Remove the product from visible products
    const updatedVisible = visibleProducts.filter(p => p.id !== productId);
    
    // Find unused products from allProducts that are not currently visible
    const currentVisibleIds = updatedVisible.map(p => p.id);
    const unusedProducts = allProducts.filter(p => !currentVisibleIds.includes(p.id) && p.id !== productId);
    
    // Add the next unused product if available and we have less than 2 visible
    if (updatedVisible.length < 2 && unusedProducts.length > 0) {
      updatedVisible.push(unusedProducts[0]);
    }
    
    setVisibleProducts(updatedVisible);
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
          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/80">Searching for products...</p>
            </div>
          )}
          
          {/* Products above chat */}
          {visibleProducts.length > 0 && !loading && (
            <div>
              <h2 className="font-bold text-lg mb-4 text-white/90">Amazon Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {visibleProducts.map((product: Product) => (
                  <div key={product.id} className="bg-white/80 rounded-2xl p-6 flex flex-col gap-3 shadow-lg border border-white/40 hover:scale-[1.03] transition-transform relative">
                    {/* X button to remove product */}
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="absolute top-3 right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors z-10"
                      aria-label="Remove product"
                    >
                      ×
                    </button>
                    
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-40 object-cover rounded-xl shadow mb-2"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1513708927688-890a1e2b6b94?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                    <div className="font-semibold text-lg text-gray-900 line-clamp-2">{product.name}</div>
                    <div className="text-blue-700 text-xl font-bold">${product.price.toFixed(2)}</div>
                    {product.rating && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>⭐ {product.rating}</span>
                        {product.reviews_count && <span>({product.reviews_count} reviews)</span>}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>
                      {product.link && (
                        <a 
                          href={product.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-gray-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-gray-600 transition text-center"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat input */}
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
                placeholder="Search for products (e.g., 'memory cards', 'headphones')..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full p-2 shadow hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-50"
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
