import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Debug environment variables
    console.log('Environment check:');
    console.log('process.env.ASINDATAAPIKEY:', process.env.ASINDATAAPIKEY);
    console.log('All env vars:', Object.keys(process.env));
    
    // Try the hardcoded API key for now to test the API functionality
    const apiKey = process.env.ASINDATAAPIKEY || "36FB2DB78A2843E2851EED9EA190DF0E";
    
    console.log('Using API key:', apiKey ? 'Found' : 'Not found');

    // set up the request parameters
    const params = {
      api_key: apiKey,
      type: "search",
      amazon_domain: "amazon.com",
      search_term: searchTerm
    };

    // make the http GET request to ASIN Data API
    const response = await axios.get('https://api.asindataapi.com/request', { params });
    
    // Log the full response to console for debugging
    console.log('=== ASIN Data API Response ===');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    console.log('Search results length:', response.data.search_results?.length || 0);
    
    // Log individual items to see their structure
    if (response.data.search_results && response.data.search_results.length > 0) {
      console.log('First item structure:', JSON.stringify(response.data.search_results[0], null, 2));
    }
    
    // Transform the response to match our Product interface - return ALL products
    const products = response.data.search_results?.map((item: any, index: number) => {
      console.log(`Item ${index + 1}:`, {
        title: item.title,
        asin: item.asin,
        price: item.price,
        image: item.image
      });
      
      return {
        id: index + 1,
        name: item.title || 'Unknown Product',
        price: parseFloat(item.price?.value || item.price) || 0,
        imageUrl: item.image || 'https://images.unsplash.com/photo-1513708927688-890a1e2b6b94?auto=format&fit=crop&w=400&q=80',
        asin: item.asin,
        link: item.link,
        rating: item.rating,
        reviews_count: item.reviews_count || item.ratings_total
      };
    }) || [];

    console.log('Transformed products:', products);
    return NextResponse.json({ products });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// Keep the GET method for testing
export async function GET() {
  return NextResponse.json({ message: 'Products API endpoint - use POST with searchTerm' });
}