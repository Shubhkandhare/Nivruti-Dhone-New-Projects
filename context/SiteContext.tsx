
import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import { SiteData, Product, CartItem, ProductVariantOption } from '../types';

// IndexedDB Utilities
const DB_NAME = 'NaturesKnackDB';
const STORE_NAME = 'SiteDataStore';
const DB_VERSION = 1;
const DATA_KEY = 'currentSiteData';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB not supported"));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

const saveToDB = async (data: SiteData): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, DATA_KEY);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

const loadFromDB = async (): Promise<SiteData | undefined> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(DATA_KEY);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

// Comprehensive initial data for the entire website
const initialSiteData: SiteData = {
  theme: {
    colors: {
      primary: '#1E4631',
      secondary: '#F6AD55',
      accent: '#E53E3E',
      background: '#FBF5ED',
      text: '#1E4631',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
    },
  },
  // Using lightweight SVG data URIs to prevent localStorage quota limits on initial load
  logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMDAgNjAiPjxwYXRoIGQ9Ik0zNSA1MFExNSA0NSAyMCAyNVEzMCA1IDUwIDEwUTYwIDI1IDUwIDEwUTYwIDI1IDUwIDEwUTQwIDU1IDM1IDUwWk0zNSA1MFE0MCAzMCA1MCAxMCIgZmlsbD0iIzFFNDYzMSIgc3Ryb2tlPSIjRjZBRDU1IiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI3MCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIzMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxRTQ2MzEiPk5hdHVyZSdzIEtuYWNrPC90ZXh0Pjwvc3ZnPg==',
  faviconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIGZpbGw9IiMxRTQ2MzEiLz48dGV4dCB4PSIxNSIgeT0iMzUiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIzMCIgZmlsbD0id2hpdGUiPk48L3RleHQ+PC9zdmc+',
  navLinks: [
    { id: 1, text: 'Home', path: 'home' },
    { id: 2, text: 'Products', path: 'products' },
    { id: 3, text: 'About', path: 'about' },
    { id: 4, text: 'Blog', path: 'blog' },
    { id: 5, text: 'Contact', path: 'contact' },
  ],
  heroSection: {
    title: 'Taste the Goodness of Nature',
    subtitle: 'From our farm to your table, experience the freshest organic products, bursting with flavor and nutrients.',
    buttonText: 'Explore Our Harvest',
    imageUrl: 'https://picsum.photos/seed/hero2/1920/1080',
  },
  products: [
    { 
      id: 1, 
      name: 'Healthy Mix Seeds', 
      category: 'Seeds', 
      price: 12.99, 
      description: 'A nutritious blend of pumpkin, sunflower, flax, and chia seeds. Perfect for a healthy snack or topping for salads and yogurt.', 
      imageUrl: 'https://i.ibb.co/P9L03fQ/healthy-mix-seeds.png',
      tags: ['snack', 'organic', 'protein', 'mix'],
      views: 120,
      variant: { 
        name: 'Size', 
        options: [
          { id: '250g', value: '250g', price: 12.99 },
          { id: '500g', value: '500g', price: 22.99 },
        ]
      }
    },
    { 
      id: 2, 
      name: 'Healthy Flax Seeds', 
      category: 'Seeds', 
      price: 8.49, 
      description: 'Packed with omega-3 fatty acids and fiber, these organic flax seeds are a great addition to smoothies, oatmeal, and baked goods.', 
      imageUrl: 'https://i.ibb.co/yqgdb3D/healthy-flax-seeds.png',
      tags: ['omega-3', 'fiber', 'baking', 'smoothie'],
      views: 85,
      variant: {
        name: 'Size',
        options: [
          { id: '200g', value: '200g', price: 8.49 },
          { id: '400g', value: '400g', price: 15.49 },
        ]
      }
    },
    { 
      id: 4, 
      name: 'Healthy Curry Leaves Powder', 
      category: 'Spices', 
      price: 5.99, 
      description: 'Aromatic and flavorful powder made from fresh curry leaves. Adds a unique taste to South Indian dishes, soups, and marinades.', 
      imageUrl: 'https://i.ibb.co/28d4dF6/healthy-curry-leaves-powder.png',
      tags: ['indian', 'aromatic', 'cooking', 'powder'],
      views: 45
    },
    { 
      id: 5, 
      name: 'Healthy White Sesame Seeds', 
      category: 'Seeds', 
      price: 15.00, 
      description: 'Organic white sesame seeds, perfect for baking, cooking, or as a topping for salads and stir-fries. A great source of calcium and healthy fats.', 
      imageUrl: 'https://i.ibb.co/GcFm2sc/healthy-white-sesame-seeds.png',
      tags: ['baking', 'cooking', 'calcium', 'topping'],
      views: 60
    },
    { 
      id: 6, 
      name: 'Healthy Moringa Powder', 
      category: 'Spices', 
      price: 6.50, 
      description: 'Nutrient-dense powder from naturally dried moringa leaves. A great addition to smoothies and juices for a powerful health boost.', 
      imageUrl: 'https://i.ibb.co/MggtP1B/healthy-moringa-powder.png',
      tags: ['superfood', 'green', 'smoothie', 'detox'],
      views: 95
    },
    { 
      id: 7, 
      name: 'Healthy Pumpkin Seeds', 
      category: 'Seeds', 
      price: 9.99, 
      description: 'Raw and unsalted pumpkin seeds, perfect for snacking or adding to your favorite dishes.', 
      imageUrl: 'https://i.ibb.co/xJSRvM8/healthy-pumpkin-seeds.png',
      tags: ['snack', 'raw', 'unsalted', 'protein'],
      views: 110
    },
    { 
      id: 8, 
      name: 'Healthy Chia Seeds', 
      category: 'Seeds', 
      price: 11.50, 
      description: 'Organic chia seeds packed with omega-3, fiber, and protein.', 
      imageUrl: 'https://i.ibb.co/yWnZnXB/healthy-chia-seeds.png',
      tags: ['omega-3', 'superfood', 'pudding', 'hydration'],
      views: 150
    },
    { 
      id: 9, 
      name: 'Healthy Garlic Powder', 
      category: 'Spices', 
      price: 4.99, 
      description: 'Pure, granulated garlic powder to add a savory kick to any meal.', 
      imageUrl: 'https://i.ibb.co/LQr0j1d/healthy-garlic-powder.png',
      tags: ['flavor', 'seasoning', 'cooking', 'savory'],
      views: 75
    },
  ],
  featuredProductIds: [1, 2, 4, 5],
  blogPosts: [
    { id: 1, title: 'The Top 5 Health Benefits of Seeds', author: 'Jane Doe', date: 'October 26, 2023', imageUrl: 'https://picsum.photos/seed/b1/1200/800', content: 'Seeds are nutritional powerhouses. In this post, we explore the incredible health benefits of incorporating seeds like chia, flax, and pumpkin into your daily diet...\nThey are packed with fiber, protein, and healthy fats, making them a perfect addition to any meal.' },
    { id: 2, title: 'A Guide to Healthy Snacking', author: 'John Smith', date: 'October 15, 2023', imageUrl: 'https://picsum.photos/seed/b2/1200/800', content: 'Snacking doesn\'t have to be unhealthy. Learn how to choose snacks that provide energy and nutrients, keeping you full and focused throughout the day...\nWe will cover everything from fruit and nuts to our delicious veggie crisps.' },
  ],
  testimonials: [
    { id: 1, quote: 'The best organic snacks I\'ve ever had! The quality is amazing and the delivery is always so fast.', author: 'Emily R.', location: 'New York, NY' },
    { id: 2, quote: 'I\'m obsessed with the almond butter. It\'s so creamy and flavorful. I can\'t start my day without it!', author: 'Michael B.', location: 'Austin, TX' },
  ],
  pageContent: {
    about: {
      title: 'Our Story: From a Small Kitchen to Your Table',
      story: 'Nature\'s Knack was born from a simple idea: that healthy food should be delicious and accessible to everyone. What started as a passion project in a small home kitchen has grown into a community of food lovers who believe in the power of natural, organic ingredients.',
      mission: 'Our mission is to provide high-quality, minimally processed foods that nourish your body and delight your taste buds. We carefully source our ingredients from trusted farmers and producers who share our commitment to sustainability and ethical practices.',
      values: 'Quality, Transparency, Sustainability, and Community.',
      imageUrl: 'https://picsum.photos/seed/nature/1200/800',
    },
    contact: {
      title: 'Get In Touch',
      address: '123 Organic Lane, Healthville, USA 90210',
      phone: '1-800-NATURES',
      email: 'hello@naturesknack.com',
      businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM',
    },
  },
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
  },
};

interface SiteContextType {
  siteData: SiteData;
  setSiteData: Dispatch<SetStateAction<SiteData>>;
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, selectedOption?: ProductVariantOption) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  notification: { message: string; type: 'success' | 'error'; id: number } | null;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  clearNotification: () => void;
  isDataLoaded: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to initial data, will overload with DB data on mount
  const [siteData, setSiteData] = useState<SiteData>(initialSiteData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('naturesKnackWishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading wishlist:', error);
      return [];
    }
  });
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type, id: Date.now() });
  }, []);

  const clearNotification = () => {
      setNotification(null);
  };

  // Initialize from IndexedDB (with localStorage migration fallback)
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try to load from IndexedDB
        const dbData = await loadFromDB();
        
        if (dbData) {
          setSiteData(dbData);
        } else {
          // 2. If IDB is empty, check localStorage (Migration Step)
          const lsData = localStorage.getItem('naturesKnackSiteData');
          if (lsData) {
             try {
               const parsed = JSON.parse(lsData);
               setSiteData(parsed);
               // Save to DB immediately to complete migration
               await saveToDB(parsed);
               console.log("Migrated data from localStorage to IndexedDB");
             } catch (e) {
               console.error("Migration failed", e);
             }
          }
        }
      } catch (err) {
        console.error("Error during initial data load:", err);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, []);

  // Persist siteData to IndexedDB whenever it changes (Debounced)
  useEffect(() => {
    // Don't overwrite the DB if we haven't loaded initial data yet
    if (!isDataLoaded) return;

    const saveData = async () => {
      try {
        await saveToDB(siteData);
      } catch (error: any) {
        console.error('Error saving site data to IDB:', error);
        showNotification("Error saving data. Please try using smaller images.", 'error');
      }
    };
    
    // Debounce to prevent slamming the database on every keystroke
    const timeoutId = setTimeout(saveData, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [siteData, isDataLoaded, showNotification]);
  
  // Persist wishlist (small enough for localStorage)
  useEffect(() => {
    try {
        localStorage.setItem('naturesKnackWishlist', JSON.stringify(wishlist));
    } catch (error) {
        console.error('Error saving wishlist:', error);
    }
  }, [wishlist]);


  const addToCart = (product: Product, quantity: number = 1, selectedOption?: ProductVariantOption) => {
    const optionToUse = selectedOption || (product.variant ? product.variant.options[0] : undefined);
    const cartItemId = optionToUse ? `${product.id}-${optionToUse.value}` : `${product.id}`;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
      if (existingItem) {
        return prevCart.map(item =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newCartItem: CartItem = {
          ...product,
          quantity,
          selectedOption: optionToUse,
          cartItemId,
          price: optionToUse ? optionToUse.price : product.price,
        };
        return [...prevCart, newCartItem];
      }
    });
    
    showNotification(`Added ${quantity > 1 ? quantity + ' x ' : ''}${product.name} to cart`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity } : item));
    }
  };
  
  const toggleWishlist = (productId: number) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };


  return (
    <SiteContext.Provider value={{ siteData, setSiteData, cart, addToCart, updateCartQuantity, removeFromCart, clearCart, wishlist, toggleWishlist, notification, showNotification, clearNotification, isDataLoaded }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteData = (): SiteContextType => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSiteData must be used within a SiteProvider');
  }
  return context;
};
