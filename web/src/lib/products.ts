import { supabase } from './supabase';

export type ProductStatus = 'available' | 'coming-soon' | 'claimed' | 'reserved';

export interface Product {
  sku: string;
  title: string;
  origin: string | null;
  year: string | null;
  price: number | null;
  status: ProductStatus;
  story: string[] | null;
  specs: Record<string, string> | null;
  teaser: string | null;
  epitaph: string | null;
  image: string | null;
  reference_image: boolean;
  sort_order: number;
}

// Safety net, mirrored from the live site's FALLBACK_PRODUCTS. If the Supabase
// fetch fails we still render a coherent catalog rather than an empty page.
// Kept intentionally small here; the full list is ported during content
// migration. NEVER add an item DOKU doesn't actually own (Hard rule 1).
export const FALLBACK_PRODUCTS: Product[] = [
  {
    sku: '014', title: 'The koi lacquer box', origin: 'Kyoto, Japan', year: '2026',
    price: 1840, status: 'available',
    story: [
      'Found in a closing workshop on the outskirts of Kyoto, this box was hand-lacquered using a technique its maker never taught to an apprentice. There will be no second piece made this way.',
    ],
    specs: { Origin: 'Kyoto, Japan', Material: 'Hand-lacquered wood', Edition: '1 of 1 — no reissue', Catalog: 'DOKU N° 014' },
    teaser: null, epitaph: null, image: null, reference_image: false, sort_order: 0,
  },
];

// Default photo per sku, served from web/public/products/. Public-domain / CC0
// museum photographs (Wikimedia Commons) — not the actual DOKU pieces; shown
// without a disclosure by the owner's explicit override of Hard rule 1
// (2026-10-27). An `image` set in the database always wins over these.
const DEFAULT_IMAGES = new Set(['003', '007', '009', '012', '014', '015', '016', '019', '020', '021']);

const withDefaultImage = (p: Product): Product =>
  p.image || !DEFAULT_IMAGES.has(p.sku) ? p : { ...p, image: `/products/${p.sku}.jpg` };

/** The photo for the item page's ivory mat: a default photo trimmed to the
 *  object (scripts/trim-product-photos.py); any other image as it is. */
export const matImage = (p: Product): string | null =>
  p.image === `/products/${p.sku}.jpg` ? `/products/mat/${p.sku}.jpg` : p.image;

// Server-side fetch used by SSR pages. RLS allows anon SELECT on products.
export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase()
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_PRODUCTS.map(withDefaultImage);
    return (data as Product[]).map(withDefaultImage);
  } catch {
    return FALLBACK_PRODUCTS.map(withDefaultImage);
  }
}

export async function fetchProduct(sku: string): Promise<Product | null> {
  const all = await fetchProducts();
  return all.find((p) => p.sku === sku) ?? null;
}
