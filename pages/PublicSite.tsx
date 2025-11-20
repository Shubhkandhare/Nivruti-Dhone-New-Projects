import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSiteData } from '../context/SiteContext';
import { Product, BlogPost, SimplePageName, ProductVariantOption, CartItem, PageState } from '../types';
import { MenuIcon, CloseIcon, ShoppingCartIcon, SearchIcon, HeartIcon, CheckCircleIcon, SunIcon, MoonIcon, FacebookIcon, InstagramIcon, TwitterIcon, CreditCardIcon, WalletIcon, MapPinIcon, PhoneIcon, MailIcon, ClockIcon } from '../components/Icons';

// Helper function to generate image URLs for different formats
const getImageUrlFormats = (originalUrl: string) => {
    if (!originalUrl) return { webp: '', original: '' };
    
    // If it's a data URI, it's likely already optimized (e.g. from AdminDashboard saves as webp)
    if (originalUrl.startsWith('data:')) {
        return { webp: originalUrl, original: originalUrl };
    }

    // For external URLs, we cannot safely guess if a WebP variant exists on the server.
    // Returning the original URL for both fields ensures we don't generate 404s.
    return {
        webp: originalUrl,
        original: originalUrl,
    };
};

interface SkeletonLoaderProps {
    className?: string;
}
const SkeletonLoader = ({ className }: SkeletonLoaderProps) => (
    <div className={`animate-shimmer bg-gray-200 ${className}`}></div>
);

// Product Skeleton
const ProductCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className="relative h-64 bg-gray-200 animate-shimmer"></div>
        <div className="p-4 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-shimmer"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-shimmer mt-2"></div>
        </div>
    </div>
);

// Blog Post Skeleton
const BlogPostSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-64 bg-gray-200 animate-shimmer"></div>
        <div className="p-6 space-y-4">
            <div className="h-3 bg-gray-200 rounded w-1/4 animate-shimmer"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full animate-shimmer"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6 animate-shimmer"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6 animate-shimmer"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-shimmer mt-4"></div>
        </div>
    </div>
);

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    containerClassName?: string;
    priority?: boolean; // If true, bypass lazy loading (e.g., for LCP images)
    sizes?: string; // Standard HTML sizes attribute for responsive resource selection
    onClick?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, containerClassName, priority = false, sizes = '100vw', onClick }) => {
    const [isVisible, setIsVisible] = useState(priority);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const imageUrls = useMemo(() => getImageUrlFormats(src), [src]);

    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: '200px' }); // Start loading when 200px away

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
            observer.disconnect();
        };
    }, [priority]);

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${containerClassName || ''}`} onClick={onClick}>
            {/* Placeholder / Skeleton - Fades out smoothly when loaded */}
            <div 
                className={`absolute inset-0 w-full h-full bg-gray-50 transition-opacity duration-700 ease-in-out z-10 pointer-events-none ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                aria-hidden="true"
            >
                <SkeletonLoader className="w-full h-full" />
            </div>
            
            {isVisible && (
                <picture>
                    {imageUrls.webp !== imageUrls.original && (
                        <source type="image/webp" srcSet={imageUrls.webp} sizes={sizes} />
                    )}
                    <img
                        src={imageUrls.original}
                        alt={alt}
                        sizes={sizes}
                        className={`
                            transition-all duration-700 ease-out
                            ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-110'} 
                            ${className || ''}
                        `}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setIsLoaded(true)}
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                    />
                </picture>
            )}
        </div>
    );
};

interface VideoPlayerProps {
    url: string;
    title?: string;
    poster?: string;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title = "Video content", poster, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: '200px' });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    if (!url) return null;

    // Check for YouTube (Standard links, Short links, Embed links)
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    // Check for Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    const isEmbed = youtubeMatch || vimeoMatch;

    // Embeds use standard 16:9 aspect ratio padding hack
    // Native videos use a standard class, defaulting to aspect-video for placeholder to prevent layout shift
    const containerClasses = isEmbed 
        ? `relative w-full pb-[56.25%] h-0 bg-gray-200 rounded-lg shadow-lg overflow-hidden ${className}`
        : `relative w-full rounded-lg shadow-lg overflow-hidden bg-black ${!isVisible ? 'aspect-video' : ''} ${className}`;

    return (
        <div ref={containerRef} className={containerClasses}>
            {!isVisible ? (
                 <SkeletonLoader className="absolute inset-0 w-full h-full" />
            ) : (
                <>
                    {youtubeMatch && (
                        <iframe 
                            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                            loading="lazy"
                        ></iframe>
                    )}

                    {vimeoMatch && (
                        <iframe 
                            src={`https://player.vimeo.com/video/${vimeoMatch[1]}?badge=0&autopause=0&player_id=0&app_id=58479`}
                            title={title}
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowFullScreen 
                            className="absolute top-0 left-0 w-full h-full"
                            loading="lazy"
                        ></iframe>
                    )}

                    {!isEmbed && (
                        <video 
                            controls 
                            playsInline
                            className="w-full h-full object-contain bg-black" 
                            preload="metadata"
                            poster={poster}
                            aria-label={title}
                        >
                            <source src={url} />
                            Your browser does not support the video tag.
                        </video>
                    )}
                </>
            )}
        </div>
    );
};


// Props for PublicSite component
interface PublicSiteProps {
  currentPage: PageState;
  navigate: (page: PageState) => void;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

// Reusable Button Component
const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`bg-primary text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 ${className}`}
    >
        {children}
    </button>
);

// Theme Constants
const LIGHT_THEME = {
    primary: '#1E4631',
    secondary: '#F6AD55',
    accent: '#E53E3E',
    background: '#FBF5ED',
    text: '#1E4631',
};

const DARK_THEME = {
    primary: '#68D391',
    secondary: '#FBD38D',
    accent: '#FC8181',
    background: '#111827',
    text: '#F7FAFC',
};


// Header Component
interface HeaderProps {
    navigate: (page: PageState) => void;
    onCartClick: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}
const Header = ({ navigate, onCartClick, searchQuery, setSearchQuery }: HeaderProps) => {
    const { siteData, setSiteData, cart, wishlist } = useSiteData();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    const [isAnimating, setIsAnimating] = useState(false);
    const prevCartCount = useRef(cartCount);

    useEffect(() => {
        if (cartCount > prevCartCount.current) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
        prevCartCount.current = cartCount;
    }, [cartCount]);

    const isDarkMode = siteData.theme.colors.background === DARK_THEME.background;

    const toggleTheme = () => {
        setSiteData(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                colors: isDarkMode ? LIGHT_THEME : DARK_THEME
            }
        }));
    };

    return (
        <header className="sticky top-0 z-40 bg-bg-base shadow-sm transition-colors duration-300">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
                {/* Logo */}
                <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => navigate({ name: 'home' })}>
                    {siteData.logoUrl ? (
                         <img src={siteData.logoUrl} alt="Nature's Knack" className="h-12 w-auto mr-2" />
                    ) : (
                         <h1 className="text-2xl font-heading font-bold text-primary">Nature's Knack</h1>
                    )}
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex flex-1 justify-center items-center gap-8 lg:gap-12">
                    {siteData.navLinks.map(link => (
                        <button
                            key={link.id}
                            onClick={() => navigate({ name: link.path })}
                            className="text-text-base hover:text-primary font-medium transition-colors whitespace-nowrap"
                        >
                            {link.text}
                        </button>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                     <div className="hidden md:block relative">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="pl-8 pr-3 py-1 rounded-full border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none w-32 lg:w-48 xl:w-64 text-sm transition-all text-gray-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>

                    {/* Theme Toggle */}
                    <button 
                        onClick={toggleTheme} 
                        className={`text-text-base hover:text-primary transition-colors p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </button>

                    {/* Wishlist */}
                    <button onClick={() => navigate({ name: 'wishlist' })} className="relative text-text-base hover:text-primary transition-colors">
                         <HeartIcon className="w-6 h-6" />
                         {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{wishlist.length}</span>}
                    </button>

                    {/* Cart */}
                    <button 
                        onClick={onCartClick} 
                        className={`relative text-text-base hover:text-primary transition-transform ${isAnimating ? 'scale-110' : 'scale-100'}`}
                    >
                        <ShoppingCartIcon className="w-6 h-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-text-base" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t p-4 absolute w-full shadow-lg z-50 text-gray-800">
                     <div className="mb-4 relative">
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="pl-8 pr-3 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    <nav className="flex flex-col space-y-3">
                        {siteData.navLinks.map(link => (
                            <button
                                key={link.id}
                                onClick={() => { navigate({ name: link.path }); setIsMenuOpen(false); }}
                                className="text-left hover:text-primary font-medium"
                            >
                                {link.text}
                            </button>
                        ))}
                        <div className="pt-2 border-t mt-2 flex items-center justify-between">
                            <span>Dark Mode</span>
                            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100">
                                {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};

// Hero Section
const Hero = ({ navigate }: { navigate: (page: PageState) => void }) => {
    const { siteData } = useSiteData();
    const { heroSection } = siteData;

    return (
        <section className="relative h-[600px] flex items-center justify-center text-center text-white">
             <div className="absolute inset-0">
                 <LazyImage 
                    src={heroSection.imageUrl} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                    priority={true}
                    sizes="100vw"
                 />
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 px-4 max-w-3xl mx-auto animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 leading-tight shadow-sm">{heroSection.title}</h1>
                <p className="text-lg md:text-xl mb-8 font-light">{heroSection.subtitle}</p>
                <Button onClick={() => navigate({ name: 'products' })} className="text-lg px-8 py-4 shadow-lg hover:shadow-xl">
                    {heroSection.buttonText}
                </Button>
            </div>
        </section>
    );
};

// Product Card Component
interface ProductCardProps {
    product: Product;
    onClick: () => void;
    key?: React.Key;
}
const ProductCard = ({ product, onClick }: ProductCardProps) => {
    const { addToCart, toggleWishlist, wishlist } = useSiteData();
    const isWishlisted = wishlist.includes(product.id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    // Use first image if available, fallback to imageUrl
    const displayImage = product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;

    return (
        <div 
            onClick={onClick}
            className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 transform cursor-pointer border border-gray-100"
        >
             {/* Standardized Height h-64, Removed bg-gray-50 for transparent look, object-contain to prevent cropping */}
             <div className="relative h-64 overflow-hidden p-4">
                <LazyImage 
                    src={displayImage} 
                    alt={product.name} 
                    className="object-contain w-full h-full transition-transform duration-700 group-hover:scale-110"
                    containerClassName="w-full h-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                
                {/* Wishlist Button - Always visible but subtle */}
                 <button 
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 transition-colors shadow-md z-20 border border-gray-100"
                >
                    <HeartIcon filled={isWishlisted} className={isWishlisted ? "text-red-500" : ""} />
                </button>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                     <button 
                        className="bg-white text-gray-800 p-3 rounded-full shadow-xl hover:bg-primary hover:text-white transition-all transform hover:scale-110 flex items-center justify-center"
                        title="Quick View"
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                     >
                        <SearchIcon className="w-6 h-6" />
                     </button>
                     <button 
                        onClick={handleAddToCart}
                        className="bg-white text-gray-800 p-3 rounded-full shadow-xl hover:bg-primary hover:text-white transition-all transform hover:scale-110 flex items-center justify-center"
                        title="Add to Cart"
                     >
                        <ShoppingCartIcon className="w-6 h-6" />
                     </button>
                </div>
            </div>

            <div className="p-4 border-t border-gray-50">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{product.category}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                <div className="flex justify-between items-center">
                    <span className="text-primary font-bold text-lg">
                        {product.variant ? `From $${product.price.toFixed(2)}` : `$${product.price.toFixed(2)}`}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Product Detail View
const ProductDetail = ({ product, onBack, navigate }: { product: Product, onBack: () => void, navigate: (page: PageState) => void }) => {
    const { addToCart, siteData, setSiteData } = useSiteData();
    const [selectedOptionId, setSelectedOptionId] = useState<string>(product.variant?.options[0].id || '');
    const [quantity, setQuantity] = useState(1);

    // Gather all images, prioritizing the images array but falling back to imageUrl if needed
    const productImages = useMemo(() => {
        const imgs = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
        // Filter out any potential empty strings
        return imgs.filter(Boolean);
    }, [product]);

    const [activeImg, setActiveImg] = useState(productImages[0]);

    // Reset active image when product changes
    useEffect(() => {
        setActiveImg(productImages[0]);
    }, [productImages]);

    const selectedOption = product.variant?.options.find(opt => opt.id === selectedOptionId);
    const currentPrice = selectedOption ? selectedOption.price : product.price;

    // Increment view count on mount
    useEffect(() => {
        setSiteData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === product.id ? { ...p, views: (p.views || 0) + 1 } : p)
        }));
    }, [product.id, setSiteData]);

    // Advanced Related Products Logic
    const relatedProducts = useMemo(() => {
        return siteData.products
            .filter(p => p.id !== product.id)
            .map(p => {
                let score = 0;
                // Category match: High weight
                if (p.category === product.category) score += 10;
                
                // Tag match: Medium weight
                if (p.tags && product.tags) {
                    const sharedTags = p.tags.filter(tag => product.tags!.includes(tag));
                    score += sharedTags.length * 3;
                }

                // Name similarity: Low weight
                const pName = p.name.toLowerCase();
                const cName = product.name.toLowerCase();
                const pWords = pName.split(' ');
                const matches = pWords.filter(word => word.length > 3 && cName.includes(word));
                score += matches.length * 1;

                // Popularity tie-breaker
                score += (p.views || 0) * 0.01;

                return { product: p, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map(item => item.product);
    }, [product, siteData.products]);

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={onBack} className="mb-6 flex items-center text-gray-600 hover:text-primary">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Products
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                {/* Image Gallery Section */}
                <div className="flex flex-col gap-4">
                     <div className="bg-white rounded-lg overflow-hidden border border-gray-100 h-96 md:h-[500px] p-8 flex items-center justify-center">
                        <LazyImage 
                            src={activeImg} 
                            alt={product.name} 
                            className="w-full h-full object-contain" 
                            containerClassName="w-full h-full"
                            priority={true} 
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </div>
                    {productImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {productImages.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setActiveImg(img)}
                                    className={`w-20 h-20 flex-shrink-0 rounded-md border cursor-pointer p-1 transition-all ${activeImg === img ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <LazyImage 
                                        src={img} 
                                        alt={`${product.name} view ${idx + 1}`}
                                        className="w-full h-full object-contain"
                                        containerClassName="w-full h-full"
                                        sizes="80px"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{product.category}</span>
                        {product.tags?.map(tag => (
                             <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">{tag}</span>
                        ))}
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4 text-gray-900">{product.name}</h1>
                    <p className="text-2xl font-bold text-primary mb-6">${currentPrice.toFixed(2)}</p>
                    
                    <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

                    {product.variant && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">{product.variant.name}</label>
                            <div className="flex flex-wrap gap-2">
                                {product.variant.options.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => setSelectedOptionId(option.id)}
                                        className={`px-4 py-2 rounded border transition-all ${selectedOptionId === option.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}`}
                                    >
                                        {option.value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-8">
                         <div className="flex items-center border border-gray-300 rounded-md">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100">-</button>
                            <span className="px-3 py-2 min-w-[3rem] text-center">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 hover:bg-gray-100">+</button>
                        </div>
                        <Button onClick={() => addToCart(product, quantity, selectedOption)} className="flex-1">
                            Add to Cart
                        </Button>
                    </div>
                    
                    {product.videoUrl && (
                        <div className="mt-8">
                             <h3 className="text-lg font-bold mb-4">Product Video</h3>
                             <VideoPlayer 
                                url={product.videoUrl} 
                                title={`Video for ${product.name}`} 
                                poster={product.imageUrl} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="border-t pt-12">
                    <h2 className="text-2xl font-heading font-bold mb-8">You May Also Like</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map(p => (
                            <ProductCard key={p.id} product={p} onClick={() => navigate({ name: 'productDetail', id: p.id })} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Mock Backend API - This function simulates a backend endpoint call
const mockPaymentApi = async (paymentDetails: any): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
        console.log("Sending payment details to backend:", paymentDetails);
        setTimeout(() => {
            // Simulate basic server-side validation logic
            if (paymentDetails.method === 'card' && paymentDetails.cardNumber.replace(/\s/g, '') === '0000000000000000') {
                 resolve({ success: false, message: 'Card declined: Invalid card number.' });
            } else if (paymentDetails.method === 'paypal' && Math.random() > 0.9) {
                 resolve({ success: false, message: 'PayPal connection timed out.' });
            } else {
                 resolve({ success: true });
            }
        }, 2000);
    });
};

// Mock Checkout Modal
interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onPaymentComplete: () => void;
}

const CheckoutModal = ({ isOpen, onClose, total, onPaymentComplete }: CheckoutModalProps) => {
    const { showNotification } = useSiteData();
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
    const [error, setError] = useState<string | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });
    
    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('processing');
        setError(null);
        
        try {
            // This is where you would normally fetch('/api/checkout', ...)
            const result = await mockPaymentApi({
                ...formData,
                method: paymentMethod,
                amount: total,
                currency: 'USD'
            });

            if (result.success) {
                setStatus('success');
                showNotification('Payment successful!', 'success');
                setTimeout(() => {
                    onPaymentComplete();
                    onClose();
                }, 2000);
            } else {
                setStatus('idle');
                const msg = result.message || 'Payment failed. Please try again.';
                setError(msg);
                showNotification(msg, 'error');
            }
        } catch (err) {
            setStatus('idle');
            setError('Network error connecting to payment gateway.');
            showNotification('Network error connecting to payment gateway.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm" onClick={status !== 'processing' ? onClose : undefined}></div>
            <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
                {status === 'success' ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600">Thank you for your order. A confirmation email has been sent.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Secure Checkout</h2>
                            <button onClick={onClose} disabled={status === 'processing'} className="text-gray-400 hover:text-gray-600">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {error && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}
                            
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-700 border-b pb-2">Shipping Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">First Name</label>
                                            <input 
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required 
                                                type="text" 
                                                className="w-full p-2 border rounded focus:ring-primary focus:border-primary" 
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Last Name</label>
                                            <input 
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required 
                                                type="text" 
                                                className="w-full p-2 border rounded focus:ring-primary focus:border-primary" 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Address</label>
                                        <input 
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required 
                                            type="text" 
                                            className="w-full p-2 border rounded focus:ring-primary focus:border-primary" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="font-bold text-gray-700 border-b pb-2">Payment Method</h3>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' : 'border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            <CreditCardIcon className="w-5 h-5" />
                                            <span className="font-medium">Card</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('paypal')}
                                            className={`flex-1 py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            <WalletIcon className="w-5 h-5" />
                                            <span className="font-medium">PayPal</span>
                                        </button>
                                    </div>
                                </div>

                                {paymentMethod === 'card' ? (
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Card Number</label>
                                            <div className="relative">
                                                <input 
                                                    name="cardNumber"
                                                    value={formData.cardNumber}
                                                    onChange={handleInputChange}
                                                    required 
                                                    type="text" 
                                                    placeholder="0000 0000 0000 0000" 
                                                    className="w-full p-2 border rounded focus:ring-primary focus:border-primary pl-10" 
                                                />
                                                <CreditCardIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Expiry Date</label>
                                                <input 
                                                    name="expiry"
                                                    value={formData.expiry}
                                                    onChange={handleInputChange}
                                                    required 
                                                    type="text" 
                                                    placeholder="MM/YY" 
                                                    className="w-full p-2 border rounded focus:ring-primary focus:border-primary" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">CVC</label>
                                                <input 
                                                    name="cvc"
                                                    value={formData.cvc}
                                                    onChange={handleInputChange}
                                                    required 
                                                    type="text" 
                                                    placeholder="123" 
                                                    className="w-full p-2 border rounded focus:ring-primary focus:border-primary" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            <span>Payments are secure and encrypted.</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center animate-fade-in">
                                        <p className="text-blue-800 mb-4 font-medium">You will be redirected to PayPal to complete your purchase securely.</p>
                                        <div className="text-xs text-blue-600">No payment information is stored on our servers.</div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 border-t bg-gray-50">
                            <div className="flex justify-between mb-4 font-bold text-lg">
                                <span>Total to Pay</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <button 
                                form="checkout-form"
                                type="submit" 
                                disabled={status === 'processing'}
                                className={`w-full font-bold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 transition-all flex justify-center items-center ${paymentMethod === 'paypal' ? 'bg-[#0070ba] text-white' : 'bg-primary text-white'}`}
                            >
                                {status === 'processing' ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    paymentMethod === 'paypal' ? 'Pay with PayPal' : `Pay $${total.toFixed(2)}`
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Cart Drawer
const CartDrawer = ({ isOpen, onClose, onCheckout }: { isOpen: boolean, onClose: () => void, onCheckout: () => void }) => {
    const { cart, removeFromCart, updateCartQuantity } = useSiteData();
    
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-heading font-bold">Your Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ShoppingCartIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg">Your cart is empty.</p>
                            <button onClick={onClose} className="mt-4 text-primary font-medium hover:underline">Start Shopping</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-4 border-b pb-4 last:border-0">
                                    <div className="w-20 h-20 bg-white border rounded-md overflow-hidden flex-shrink-0 relative p-1">
                                        <LazyImage 
                                            src={item.images && item.images.length > 0 ? item.images[0] : item.imageUrl} 
                                            alt={item.name} 
                                            className="w-full h-full object-contain"
                                            containerClassName="w-full h-full"
                                            sizes="80px"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                                            <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        {item.selectedOption && <p className="text-sm text-gray-500 mb-2">{item.variant?.name}: {item.selectedOption.value}</p>}
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center border rounded-md">
                                                <button onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600">-</button>
                                                <span className="px-2 py-1 text-sm min-w-[1.5rem] text-center">{item.quantity}</span>
                                                <button onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100 text-gray-600">+</button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.cartItemId)} className="text-xs text-red-500 hover:text-red-700 underline">Remove</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-6 border-t bg-gray-50">
                        <div className="flex justify-between mb-4 text-lg font-bold">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <Button onClick={onCheckout} className="w-full">Checkout</Button>
                         <p className="text-center text-xs text-gray-500 mt-3">Shipping & taxes calculated at checkout</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Footer Component
const Footer = () => {
     const { siteData } = useSiteData();
     return (
        <footer className="bg-primary text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div>
                         {siteData.logoUrl ? (
                            <img src={siteData.logoUrl} alt="Nature's Knack" className="h-12 w-auto mb-4 brightness-0 invert" />
                        ) : (
                            <h3 className="text-2xl font-heading font-bold mb-4">Nature's Knack</h3>
                        )}
                        <p className="text-gray-300 leading-relaxed mb-6 max-w-xs">
                            Bringing the purest organic products from sustainable farms directly to your kitchen table.
                        </p>
                        <div className="flex space-x-4">
                            <a href={siteData.socialLinks.facebook} className="hover:text-secondary transition-colors"><FacebookIcon className="w-6 h-6" /></a>
                            <a href={siteData.socialLinks.instagram} className="hover:text-secondary transition-colors"><InstagramIcon className="w-6 h-6" /></a>
                            <a href={siteData.socialLinks.twitter} className="hover:text-secondary transition-colors"><TwitterIcon className="w-6 h-6" /></a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-secondary">Quick Links</h4>
                        <ul className="space-y-2 text-gray-300">
                            {siteData.navLinks.map(link => (
                                <li key={link.id}><a href="#" className="hover:text-white transition-colors">{link.text}</a></li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-secondary">Contact Us</h4>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-start"><span className="mr-2 mt-1"><MapPinIcon className="w-4 h-4" /></span> {siteData.pageContent.contact.address}</li>
                            <li className="flex items-center"><span className="mr-2"><PhoneIcon className="w-4 h-4" /></span> {siteData.pageContent.contact.phone}</li>
                            <li className="flex items-center"><span className="mr-2"><MailIcon className="w-4 h-4" /></span> {siteData.pageContent.contact.email}</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-secondary">Newsletter</h4>
                        <p className="text-gray-300 mb-4 text-sm">Subscribe to receive updates, access to exclusive deals, and more.</p>
                        <div className="flex">
                            <input type="email" placeholder="Enter your email" className="px-4 py-2 rounded-l-md w-full text-gray-900 focus:outline-none" />
                            <button className="bg-secondary text-primary font-bold px-4 py-2 rounded-r-md hover:bg-opacity-90">Join</button>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-white/20 pt-8 text-center text-gray-400 text-sm">
                    <p>&copy; {new Date().getFullYear()} Nature's Knack. All rights reserved.</p>
                </div>
            </div>
        </footer>
     );
};

// Cookie Consent Component
const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('naturesKnackCookieConsent');
        if (consent === null) {
            // Small delay to not overwhelm user immediately on load
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else if (consent === 'true') {
            // Initialize tracking scripts here if needed
            console.log('Tracking initialized');
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('naturesKnackCookieConsent', 'true');
        setIsVisible(false);
        console.log('Tracking initialized');
    };

    const handleDecline = () => {
        localStorage.setItem('naturesKnackCookieConsent', 'false');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg border-t border-gray-800 animate-fade-in-up">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-300 text-center md:text-left">
                    <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.</p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <button 
                        onClick={handleDecline}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Decline
                    </button>
                    <button 
                        onClick={handleAccept}
                        className="px-6 py-2 text-sm font-bold bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors shadow-sm"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main PublicSite Component
const PublicSite: React.FC<PublicSiteProps> = ({ currentPage, navigate }) => {
    const { siteData, notification, clearNotification, wishlist, clearCart, cart, showNotification } = useSiteData();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Simulated Page Loading State
    const [isPageLoading, setIsPageLoading] = useState(false);

    useEffect(() => {
        // Simulate network request delay for list views to demonstrate skeletons
        if (['home', 'products', 'blog', 'wishlist'].includes(currentPage.name)) {
            setIsPageLoading(true);
            const timer = setTimeout(() => setIsPageLoading(false), 800);
            return () => clearTimeout(timer);
        } else {
             setIsPageLoading(false);
        }
    }, [currentPage.name]);

    // Auto clear notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                clearNotification();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, clearNotification]);

    const handleCheckout = () => {
        setIsCartOpen(false);
        setIsCheckoutOpen(true);
    };

    const handlePaymentComplete = () => {
        clearCart();
        // Optional: Navigate to a specific thank you page or just let the modal handle it
    };

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        showNotification("Message sent! We'll be in touch shortly.", "success");
        const form = e.target as HTMLFormElement;
        form.reset();
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return siteData.products;
        const lowerQuery = searchQuery.toLowerCase();
        return siteData.products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) || 
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.tags?.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }, [searchQuery, siteData.products]);

    return (
        <div className="flex flex-col min-h-screen">
            <Header 
                navigate={navigate} 
                onCartClick={() => setIsCartOpen(true)} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <main className="flex-grow">
                {currentPage.name === 'home' && (
                    <>
                        <Hero navigate={navigate} />
                        
                        {/* Featured Products */}
                        <section className="py-16 container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">Featured Harvest</h2>
                                <p className="text-gray-600 max-w-2xl mx-auto">Handpicked favorites from our fields to your home.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {isPageLoading ? (
                                    Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                                ) : (
                                    siteData.products.filter(p => siteData.featuredProductIds.includes(p.id)).map(product => (
                                        <ProductCard key={product.id} product={product} onClick={() => navigate({ name: 'productDetail', id: product.id })} />
                                    ))
                                )}
                            </div>
                            <div className="text-center mt-12">
                                <Button onClick={() => navigate({ name: 'products' })} className="bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white">View All Products</Button>
                            </div>
                        </section>
                        
                        {/* About Teaser */}
                        <section className="bg-primary/5 py-16">
                             <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                                <div className="md:w-1/2">
                                    <LazyImage 
                                        src="https://picsum.photos/seed/nature/800/600" 
                                        alt="Our Farm" 
                                        className="rounded-lg shadow-lg w-full"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                </div>
                                <div className="md:w-1/2">
                                    <h2 className="text-3xl font-heading font-bold text-primary mb-6">Naturally Grown, Ethically Sourced</h2>
                                    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                                        {siteData.pageContent.about.story.substring(0, 150)}...
                                    </p>
                                    <ul className="space-y-3 mb-8">
                                        {['100% Organic Certified', 'Sustainable Farming Practices', 'Direct from Farmers', 'Plastic-free Packaging'].map((item, i) => (
                                            <li key={i} className="flex items-center text-gray-700">
                                                <CheckCircleIcon className="text-secondary mr-3 w-5 h-5" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button onClick={() => navigate({ name: 'about' })}>Our Story</Button>
                                </div>
                             </div>
                        </section>

                         {/* Testimonials */}
                         <section className="py-16 container mx-auto px-4">
                            <h2 className="text-3xl font-heading font-bold text-center text-primary mb-12">What Our Community Says</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {siteData.testimonials.map(t => (
                                    <div key={t.id} className="bg-white p-8 rounded-lg shadow-md border-t-4 border-secondary">
                                        <p className="text-gray-600 italic text-lg mb-6">"{t.quote}"</p>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{t.author}</h4>
                                            <p className="text-sm text-gray-500">{t.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {currentPage.name === 'products' && (
                    <div className="container mx-auto px-4 py-8">
                         <h1 className="text-3xl font-heading font-bold mb-8 text-primary">Our Products</h1>
                         {searchQuery && <p className="mb-6 text-gray-500">Showing results for "{searchQuery}"</p>}
                         {filteredProducts.length === 0 && !isPageLoading ? (
                             <div className="text-center py-20 bg-gray-50 rounded-lg">
                                 <p className="text-xl text-gray-500">No products found.</p>
                             </div>
                         ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {isPageLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                                ) : (
                                    filteredProducts.map(product => (
                                        <ProductCard key={product.id} product={product} onClick={() => navigate({ name: 'productDetail', id: product.id })} />
                                    ))
                                )}
                            </div>
                         )}
                    </div>
                )}

                {currentPage.name === 'productDetail' && (
                    (() => {
                        const product = siteData.products.find(p => p.id === currentPage.id);
                        return product ? <ProductDetail product={product} onBack={() => navigate({ name: 'products' })} navigate={navigate} /> : <div>Product not found</div>
                    })()
                )}

                {currentPage.name === 'about' && (
                    <div className="min-h-screen bg-white">
                        {/* Hero / Header */}
                        <div className="bg-primary/5 py-16 md:py-24">
                            <div className="container mx-auto px-4 text-center">
                                <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary mb-6 animate-fade-in-up">
                                    {siteData.pageContent.about.title}
                                </h1>
                                <div className="max-w-3xl mx-auto">
                                    <p className="text-xl md:text-2xl text-gray-700 font-light leading-relaxed italic">
                                        "{siteData.pageContent.about.mission}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="container mx-auto px-4 py-16">
                            {/* Main Image */}
                            {siteData.pageContent.about.imageUrl && (
                                <div className="mb-16 relative rounded-xl overflow-hidden shadow-2xl aspect-[21/9] group">
                                     <LazyImage 
                                        src={siteData.pageContent.about.imageUrl} 
                                        alt={siteData.pageContent.about.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        containerClassName="w-full h-full"
                                        priority={true}
                                        sizes="100vw"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Story Column */}
                                <div className="lg:col-span-7">
                                    <h2 className="text-3xl font-heading font-bold text-gray-900 mb-6 relative inline-block">
                                        Our Story
                                        <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-secondary rounded-full"></span>
                                    </h2>
                                    <div className="prose prose-lg text-gray-600 whitespace-pre-line leading-relaxed">
                                        {siteData.pageContent.about.story}
                                    </div>
                                </div>

                                {/* Values Column */}
                                <div className="lg:col-span-5">
                                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 sticky top-24">
                                        <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center">
                                            <span className="bg-primary text-white p-2 rounded-lg mr-3">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </span>
                                            Our Core Values
                                        </h3>
                                        <div className="space-y-4">
                                            {siteData.pageContent.about.values.split(',').map((value, index) => {
                                                const cleanValue = value.trim().replace(/\.$/, '');
                                                if (!cleanValue) return null;
                                                return (
                                                    <div key={index} className="flex items-start p-4 bg-white rounded-xl shadow-sm border border-gray-100 transition-transform hover:-translate-y-1 hover:shadow-md">
                                                        <div className="h-2 w-2 mt-2.5 rounded-full bg-secondary mr-3 flex-shrink-0"></div>
                                                        <span className="text-lg font-medium text-gray-800">{cleanValue}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* CTA */}
                                        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                                            <p className="text-gray-500 mb-4">Want to know more about our products?</p>
                                            <button 
                                                onClick={() => navigate({ name: 'products' })}
                                                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all"
                                            >
                                                View Our Collection
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentPage.name === 'blog' && (
                    <div className="container mx-auto px-4 py-12">
                        <h1 className="text-4xl font-heading font-bold text-primary mb-12 text-center">Journal</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {isPageLoading ? (
                                Array.from({ length: 2 }).map((_, i) => <BlogPostSkeleton key={i} />)
                            ) : (
                                siteData.blogPosts.map(post => (
                                    <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden group cursor-pointer" onClick={() => navigate({name: 'blogPost', id: post.id})}>
                                        <div className="h-64 overflow-hidden">
                                             <LazyImage 
                                                src={post.imageUrl} 
                                                alt={post.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, 50vw" 
                                            />
                                        </div>
                                        <div className="p-6">
                                            <div className="text-sm text-secondary font-bold mb-2">{post.date}</div>
                                            <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
                                            <p className="text-gray-600 line-clamp-3">{post.content}</p>
                                            <span className="inline-block mt-4 text-primary font-medium hover:underline">Read More</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                 {currentPage.name === 'blogPost' && (
                    (() => {
                        const post = siteData.blogPosts.find(p => p.id === currentPage.id);
                        if (!post) return <div>Post not found</div>;
                        return (
                             <div className="container mx-auto px-4 py-12 max-w-3xl">
                                <button onClick={() => navigate({ name: 'blog' })} className="mb-6 flex items-center text-gray-600 hover:text-primary">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    Back to Blog
                                </button>
                                <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">{post.title}</h1>
                                <div className="flex items-center text-gray-500 mb-8 border-b pb-8">
                                    <span className="mr-4">{post.date}</span>
                                    <span>By {post.author}</span>
                                </div>
                                
                                {post.videoUrl && (
                                    <div className="mb-8">
                                        <VideoPlayer 
                                            url={post.videoUrl} 
                                            title={post.title} 
                                            poster={post.imageUrl} 
                                        />
                                    </div>
                                )}

                                {!post.videoUrl && (
                                     <div className="h-80 w-full rounded-lg overflow-hidden mb-8 shadow-lg">
                                        <LazyImage 
                                            src={post.imageUrl} 
                                            alt={post.title} 
                                            className="w-full h-full object-cover" 
                                            priority={true} 
                                            sizes="100vw"
                                        />
                                    </div>
                                )}

                                <div className="prose prose-lg text-gray-800 whitespace-pre-line">
                                    {post.content}
                                </div>
                            </div>
                        );
                    })()
                )}

                {currentPage.name === 'contact' && (
                    <div className="container mx-auto px-4 py-12 max-w-4xl">
                        <h1 className="text-4xl font-heading font-bold text-primary mb-12 text-center">{siteData.pageContent.contact.title}</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-lg shadow-lg">
                            <div>
                                <h3 className="text-2xl font-bold mb-6 text-gray-800">Send us a message</h3>
                                <form className="space-y-4" onSubmit={handleContactSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input type="text" className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="Your Name" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="your@email.com" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                        <textarea rows={4} className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="How can we help you?" required></textarea>
                                    </div>
                                    <Button className="w-full">Send Message</Button>
                                </form>
                            </div>
                            <div className="bg-primary text-white p-8 rounded-lg flex flex-col">
                                <h3 className="text-2xl font-bold mb-6">Contact Info</h3>
                                <div className="space-y-6 text-lg flex-grow">
                                     <p className="flex items-start">
                                        <span className="mr-4 mt-1 bg-white/20 p-2 rounded-full"><MapPinIcon className="w-5 h-5" /></span> 
                                        <span>{siteData.pageContent.contact.address}</span>
                                    </p>
                                     <p className="flex items-center">
                                        <span className="mr-4 bg-white/20 p-2 rounded-full"><PhoneIcon className="w-5 h-5" /></span> 
                                        <span>{siteData.pageContent.contact.phone}</span>
                                    </p>
                                     <p className="flex items-center">
                                        <span className="mr-4 bg-white/20 p-2 rounded-full"><MailIcon className="w-5 h-5" /></span> 
                                        <span>{siteData.pageContent.contact.email}</span>
                                    </p>
                                     <p className="flex items-center">
                                        <span className="mr-4 bg-white/20 p-2 rounded-full"><ClockIcon className="w-5 h-5" /></span> 
                                        <span>{siteData.pageContent.contact.businessHours || 'Mon - Fri: 9:00 AM - 6:00 PM'}</span>
                                    </p>
                                </div>
                                
                                <div className="mt-12 pt-8 border-t border-white/20">
                                    <h4 className="font-bold mb-4 text-secondary">Follow Us</h4>
                                    <div className="flex space-x-6">
                                        <a href={siteData.socialLinks.facebook} className="hover:text-secondary transition-colors transform hover:scale-110"><FacebookIcon className="w-6 h-6" /></a>
                                        <a href={siteData.socialLinks.instagram} className="hover:text-secondary transition-colors transform hover:scale-110"><InstagramIcon className="w-6 h-6" /></a>
                                        <a href={siteData.socialLinks.twitter} className="hover:text-secondary transition-colors transform hover:scale-110"><TwitterIcon className="w-6 h-6" /></a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Section */}
                        <div className="mt-12 rounded-lg overflow-hidden shadow-lg h-80 bg-gray-200">
                             <iframe 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                style={{border:0}}
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(siteData.pageContent.contact.address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                                allowFullScreen
                                title="Location Map"
                                loading="lazy"
                             ></iframe>
                        </div>
                    </div>
                )}

                 {currentPage.name === 'wishlist' && (
                    <div className="container mx-auto px-4 py-12">
                        <h1 className="text-3xl font-heading font-bold mb-8 text-primary text-center">My Wishlist</h1>
                        {wishlist.length === 0 && !isPageLoading ? (
                             <div className="text-center py-20 bg-gray-50 rounded-lg">
                                 <p className="text-xl text-gray-500 mb-4">Your wishlist is empty.</p>
                                 <Button onClick={() => navigate({ name: 'products' })}>Start Shopping</Button>
                             </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {isPageLoading ? (
                                     Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                                ) : (
                                    siteData.products.filter(p => wishlist.includes(p.id)).map(product => (
                                        <ProductCard key={product.id} product={product} onClick={() => navigate({ name: 'productDetail', id: product.id })} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
            
            <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                onCheckout={handleCheckout}
            />
            
            <CheckoutModal 
                isOpen={isCheckoutOpen} 
                onClose={() => setIsCheckoutOpen(false)} 
                total={cartTotal}
                onPaymentComplete={handlePaymentComplete}
            />

            <Footer />
            
            <CookieConsent />

            {notification && (
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-500 ${notification.type === 'success' ? 'bg-primary text-white' : 'bg-red-500 text-white'}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default PublicSite;