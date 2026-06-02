// lib/algolia.ts
import algoliasearch from 'algoliasearch';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY!;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!;

export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

// Admin client for indexing (use in API routes only)
export const adminClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

export const productsIndex = 'products';
