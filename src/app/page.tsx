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
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set()); // Products user dismissed
  const [nextIndex, setNextIndex] = useState(2); // Index of next product to show
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>(""); // Show feedback for actions
  const [comparison, setComparison] = useState<{
    product1: { pros: string[]; cons: string[] };
    product2: { pros: string[]; cons: string[] };
    summary: string;
  } | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Sync cart with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Determine if input is a search query or a command
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const inputValue = input;
    setInput(""); // Clear input immediately for better UX
    
    // If we have visible products, check if this is a command rather than a new search
    if (visibleProducts.length > 0) {
      // Quick check for obvious commands before LLM call
      const lowerInput = inputValue.toLowerCase();
      const isObviousCommand = lowerInput.includes('compare') || 
                              lowerInput.includes('dismiss') || 
                              lowerInput.includes('remove') || 
                              lowerInput.includes('delete') || 
                              lowerInput.includes('add to cart') ||
                              lowerInput.includes('show next') ||
                              lowerInput.includes('get rid of');
      
      const isCommand = isObviousCommand || await checkIfCommand(inputValue);
      if (isCommand) {
        // Commands are handled instantly without loading state
        await handleCommand(inputValue);
        return;
      }
    }
    
    // For search queries, show loading state
    setLoading(true);
    
    // Otherwise, treat as a search query
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm: inputValue }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const products = data.products || [];
        setAllProducts(products);
        setVisibleProducts(products.slice(0, 2)); // Show first 2 products
        setDismissedIds(new Set()); // Reset dismissed products for new search
        setNextIndex(2); // Reset next index to 2 (after first 2 products)
        setComparison(null); // Clear any existing comparison
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
        setDismissedIds(new Set());
        setNextIndex(1);
        setComparison(null);
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
      setDismissedIds(new Set());
      setNextIndex(1);
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  // Generate pros and cons comparison between visible products
  const generateComparison = async () => {
    if (visibleProducts.length < 2) return;
    
    setLoadingComparison(true);
    
    try {
      const response = await fetch('https://litellm.rillavoice.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-rilla-vibes'
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku",
          messages: [{
            role: "user",
            content: `Compare these two products and provide pros and cons for each based on their details, price, rating, and typical customer considerations:

Product 1: ${visibleProducts[0].name}
- Price: $${visibleProducts[0].price}
- Rating: ${visibleProducts[0].rating || 'Not available'}
- Reviews: ${visibleProducts[0].reviews_count || 'Not available'}

Product 2: ${visibleProducts[1].name}
- Price: $${visibleProducts[1].price}
- Rating: ${visibleProducts[1].rating || 'Not available'}
- Reviews: ${visibleProducts[1].reviews_count || 'Not available'}

Please respond with JSON format:
{
  "product1": {
    "pros": ["pro1", "pro2", "pro3"],
    "cons": ["con1", "con2", "con3"]
  },
  "product2": {
    "pros": ["pro1", "pro2", "pro3"],
    "cons": ["con1", "con2", "con3"]
  },
  "summary": "Brief 1-2 sentence summary of which might be better for different use cases"
}

Focus on practical considerations like value for money, quality indicators, user experience, and typical use cases.`
          }]
        })
      });
      
      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content.trim());
      
      setComparison(result);
      setLastAction("✅ Generated product comparison");
      setTimeout(() => setLastAction(""), 3000);
      
    } catch (error) {
      console.error('Error generating comparison:', error);
      setLastAction("❌ Failed to generate comparison");
      setTimeout(() => setLastAction(""), 3000);
    } finally {
      setLoadingComparison(false);
    }
  };

  const removeProduct = (productId: number) => {
    // Add to dismissed products (never show again)
    const newDismissedIds = new Set(dismissedIds);
    newDismissedIds.add(productId);
    setDismissedIds(newDismissedIds);
    
    // Remove the product from visible products
    const updatedVisible = visibleProducts.filter(p => p.id !== productId);
    
    // Get the next product sequentially from allProducts
    // Keep looking until we find one that hasn't been dismissed and isn't currently visible
    let currentIndex = nextIndex;
    while (currentIndex < allProducts.length) {
      const nextProduct = allProducts[currentIndex];
      const currentVisibleIds = updatedVisible.map(p => p.id);
      
      // If product hasn't been dismissed and isn't currently visible, use it
      if (!newDismissedIds.has(nextProduct.id) && !currentVisibleIds.includes(nextProduct.id)) {
        updatedVisible.push(nextProduct);
        setNextIndex(currentIndex + 1);
        break;
      }
      currentIndex++;
    }
    
    setVisibleProducts(updatedVisible);
    
    // Clear comparison when products change
    setComparison(null);
  };

  // Check if input is a command using LLM
  const checkIfCommand = async (text: string): Promise<boolean> => {
    try {
      const response = await fetch('https://litellm.rillavoice.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-rilla-vibes'
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku",
          messages: [{
            role: "user",
            content: `Is this text a command to interact with displayed products or a new search query? 

Text: "${text}"

Current products visible: ${visibleProducts.map((p, i) => `${i+1}. ${p.name}`).join(', ')}

Commands include:
- Dismiss/remove/delete products: "dismiss product 1", "remove headphones", "get rid of the first one"
- Add to cart: "add to cart", "buy this", "add the second one"
- Compare products: "compare products", "compare", "show pros and cons", "compare these"
- Show next products: "show next", "different options", "show me more"

Reply with just "COMMAND" or "SEARCH"`
          }]
        })
      });
      
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      console.log('Command detection:', { text, result, isCommand: result === "COMMAND" });
      return result === "COMMAND";
    } catch (error) {
      console.error('Error checking command:', error);
      return false; // Default to search if LLM fails
    }
  };

  // Handle commands using LLM to parse intent
  const handleCommand = async (text: string) => {
    try {
      const response = await fetch('https://litellm.rillavoice.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-rilla-vibes'
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku",
          messages: [{
            role: "user",
            content: `Parse this command and extract the action and product reference:

Command: "${text}"

Current products:
${visibleProducts.map((p, i) => `${i+1}. ${p.name} (ID: ${p.id})`).join('\n')}

Reply with ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "action": "dismiss" | "add_to_cart" | "show_next" | "compare",
  "product_index": 1 | 2 | null,
  "product_id": null,
  "product_name_match": null
}

Example responses:
{"action": "compare", "product_index": null, "product_id": null, "product_name_match": null}
{"action": "dismiss", "product_index": 1, "product_id": null, "product_name_match": null}
{"action": "dismiss", "product_index": null, "product_id": null, "product_name_match": "headphones"}

Instructions:
- If referring to "first", "second", "1", "2" use product_index
- If referring to a specific product ID, use product_id
- If referring to product by name/title (like "remove headphones", "dismiss the bluetooth speaker"), use product_name_match with a partial name that appears in the product title
- For commands like "remove", "dismiss", "delete", "get rid of", the action should be "dismiss"
- For commands like "compare", "compare products", "show pros and cons", "compare these", the action should be "compare"
- For commands like "show next", "different options", "show more", the action should be "show_next"
- For commands like "add to cart", "buy", "purchase", the action should be "add_to_cart"
- If no specific product mentioned, use null for all fields`
          }]
        })
      });
      
      const data = await response.json();
      console.log('Raw LLM response:', data.choices[0].message.content);
      
      // Clean and parse JSON more robustly
      let rawContent = data.choices[0].message.content.trim();
      
      // Remove any markdown code blocks if present
      if (rawContent.startsWith('```json')) {
        rawContent = rawContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (rawContent.startsWith('```')) {
        rawContent = rawContent.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any extra whitespace and non-printable characters
      rawContent = rawContent.replace(/^\s+|\s+$/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      console.log('Cleaned content for parsing:', rawContent);
      
      let result;
      try {
        result = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Failed to parse content:', rawContent);
        
        // Fallback: try to extract action from text directly
        const lowerText = text.toLowerCase();
        if (lowerText.includes('compare') || lowerText.includes('pros and cons')) {
          result = { action: 'compare', product_index: null, product_id: null, product_name_match: null };
        } else if (lowerText.includes('dismiss') || lowerText.includes('remove') || lowerText.includes('delete')) {
          // Try to extract product reference
          if (lowerText.includes('product 1') || lowerText.includes('first')) {
            result = { action: 'dismiss', product_index: 1, product_id: null, product_name_match: null };
          } else if (lowerText.includes('product 2') || lowerText.includes('second')) {
            result = { action: 'dismiss', product_index: 2, product_id: null, product_name_match: null };
          } else {
            result = { action: 'dismiss', product_index: null, product_id: null, product_name_match: null };
          }
        } else {
          throw parseError; // Re-throw if we can't handle it
        }
      }
      
      console.log('Parsed command result:', result);
      
      // Additional fallback: if LLM didn't detect compare but text contains compare keywords
      const lowerText = text.toLowerCase();
      if (!result.action && (lowerText.includes('compare') || lowerText.includes('pros and cons'))) {
        result.action = 'compare';
        console.log('Fallback: Set action to compare based on keywords');
      }
      
      // Map product_index or product_name_match to product_id if needed
      let targetProductId = result.product_id;
      
      // Handle product index (1, 2, first, second, etc.)
      if (result.product_index && !targetProductId) {
        const targetProduct = visibleProducts[result.product_index - 1];
        targetProductId = targetProduct?.id;
      }
      
      // Handle product name matching (remove headphones, dismiss bluetooth speaker, etc.)
      if (result.product_name_match && !targetProductId) {
        const nameMatch = result.product_name_match.toLowerCase();
        const matchedProduct = visibleProducts.find(p => 
          p.name.toLowerCase().includes(nameMatch)
        );
        targetProductId = matchedProduct?.id;
      }
      
      // Execute the action immediately on client state (no API calls)
      if (result.action === "dismiss" && targetProductId) {
        const product = visibleProducts.find(p => p.id === targetProductId);
        if (product) {
          // Show immediate feedback
          setLastAction(`✅ Dismissed "${product.name}" and showed next alternative`);
          setTimeout(() => setLastAction(""), 3000);
          // Update state immediately
          removeProduct(targetProductId);
        }
      } else if (result.action === "add_to_cart" && targetProductId) {
        const product = visibleProducts.find(p => p.id === targetProductId);
        if (product) {
          // Show immediate feedback
          setLastAction(`✅ Added "${product.name}" to cart`);
          setTimeout(() => setLastAction(""), 3000);
          // Update state immediately
          addToCart(product);
        }
      } else if (result.action === "show_next") {
        // Replace both products with next ones from client state
        if (nextIndex < allProducts.length) {
          const newProducts = [];
          let currentIndex = nextIndex;
          
          while (newProducts.length < 2 && currentIndex < allProducts.length) {
            const nextProduct = allProducts[currentIndex];
            if (!dismissedIds.has(nextProduct.id)) {
              newProducts.push(nextProduct);
            }
            currentIndex++;
          }
          
          if (newProducts.length > 0) {
            setVisibleProducts(newProducts);
            setNextIndex(currentIndex);
            setComparison(null); // Clear comparison when showing new products
            setLastAction(`✅ Showing next ${newProducts.length} products`);
            setTimeout(() => setLastAction(""), 3000);
          } else {
            setLastAction(`⚠️ No more products available`);
            setTimeout(() => setLastAction(""), 3000);
          }
        } else {
          setLastAction(`⚠️ No more products available`);
          setTimeout(() => setLastAction(""), 3000);
        }
      } else if (result.action === "compare") {
        // Generate comparison between the two visible products
        if (visibleProducts.length >= 2) {
          await generateComparison();
        } else {
          setLastAction(`⚠️ Need at least 2 products to compare`);
          setTimeout(() => setLastAction(""), 3000);
        }
      } else {
        // No valid action found
        console.log('No valid action found in result:', result);
        setLastAction(`❌ Could not understand command: "${text}"`);
        setTimeout(() => setLastAction(""), 3000);
      }
      
    } catch (error) {
      console.error('Error handling command:', error);
      setLastAction(`❌ Could not understand command`);
      setTimeout(() => setLastAction(""), 3000);
    }
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
          {/* Action feedback */}
          {lastAction && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3 text-green-200 text-center">
              {lastAction}
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/80">
                {visibleProducts.length > 0 ? "Processing command..." : "Searching for products..."}
              </p>
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
              
              {/* Compare button */}
              {visibleProducts.length >= 2 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={generateComparison}
                    disabled={loadingComparison}
                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:from-green-600 hover:to-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingComparison ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Comparing...
                      </span>
                    ) : (
                      "📊 Compare Products"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Comparison Results */}
          {comparison && visibleProducts.length >= 2 && (
            <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-white/40">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">📊 Product Comparison</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Product 1 Comparison */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-lg text-blue-900 mb-3 truncate">
                    {visibleProducts[0].name}
                  </h4>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-green-700 mb-2">✅ Pros:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {comparison.product1.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">❌ Cons:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {comparison.product1.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Product 2 Comparison */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold text-lg text-purple-900 mb-3 truncate">
                    {visibleProducts[1].name}
                  </h4>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-green-700 mb-2">✅ Pros:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {comparison.product2.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">❌ Cons:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {comparison.product2.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <h5 className="font-medium text-gray-800 mb-2">💡 Summary:</h5>
                <p className="text-gray-700 text-sm">{comparison.summary}</p>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setComparison(null)}
                className="mt-4 w-full bg-gray-500 text-white py-2 rounded-full font-semibold hover:bg-gray-600 transition"
              >
                Close Comparison
              </button>
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
                placeholder={visibleProducts.length > 0 
                  ? "Try: 'compare products', 'dismiss product 1', 'add second one to cart', 'show me different options'..." 
                  : "Search for products (e.g., 'memory cards', 'headphones')..."
                }
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
