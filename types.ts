
export interface ProductVariantOption {
  id: string; // Unique identifier for the option, e.g., "250g"
  value: string; // e.g., "250g"
  price: number; // e.g., 12.99
}

export interface ProductVariant {
  name: string; // e.g., "Size"
  options: ProductVariantOption[];
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number; // Represents the base or starting price
  description: string;
  imageUrl: string; // Main image (fallback)
  images?: string[]; // Gallery images
  videoUrl?: string;
  variant?: ProductVariant;
  tags?: string[];
  views?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOption?: ProductVariantOption; // The chosen option
  cartItemId: string; // Unique ID for product + variant combo, e.g., "1-250g"
}


export interface BlogPost {
  id: number;
  title: string;
  author: string;
  date: string;
  imageUrl: string;
  content: string; // Rich text/markdown content
  videoUrl?: string;
}

export interface Testimonial {
  id: number;
  quote: string;
  author: string;
  location: string;
}

// FIX: Added SimplePageName type for type-safe navigation
export type SimplePageName = 'home' | 'products' | 'about' | 'blog' | 'contact' | 'wishlist';

export interface NavLink {
  id: number;
  text: string;
  // FIX: Using a stricter type for path
  path: SimplePageName; // Represents the page key
}

export interface HeroSection {
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl: string;
}

export interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
}

export interface PageContent {
  about: {
    title: string;
    story: string;
    mission: string;
    values: string;
    imageUrl?: string;
  };
  contact: {
    title: string;
    address: string;
    phone: string;
    email: string;
    businessHours?: string;
  };
}

export interface SiteData {
  theme: ThemeSettings;
  logoUrl: string;
  faviconUrl: string;
  navLinks: NavLink[];
  heroSection: HeroSection;
  products: Product[];
  featuredProductIds: number[];
  blogPosts: BlogPost[];
  testimonials: Testimonial[];
  pageContent: PageContent;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

export type PageState =
  | { name: 'home' }
  | { name: 'products' }
  | { name: 'productDetail'; id: number }
  | { name: 'about' }
  | { name: 'blog' }
  | { name: 'blogPost'; id: number }
  | { name: 'contact' }
  | { name: 'wishlist' };
