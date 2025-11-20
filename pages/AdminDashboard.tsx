
import React, { useState, useRef, useEffect } from 'react';
import { useSiteData } from '../context/SiteContext';
import { SiteData, Product, BlogPost, ProductVariantOption } from '../types';
import { SettingsIcon, HomeIcon, PackageIcon, EditIcon, FileTextIcon, PhoneIcon } from '../components/Icons';

type AdminSection = 'settings' | 'homepage' | 'products' | 'blog' | 'about' | 'contact';

type AdminInputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

const AdminInput = ({ label, ...props }: AdminInputProps) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100" />
    </div>
);

type AdminTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };
const AdminTextarea = ({ label, ...props }: AdminTextareaProps) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea rows={5} {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
    </div>
);

// Helper to compress images
const compressImage = (file: File, maxWidth = 500, maxHeight = 500, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Max dimensions - Aggressive resizing to prevent localStorage quota limits
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to WebP with specified quality for better compression and transparency support
                const dataUrl = canvas.toDataURL('image/webp', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

// Helper to process video files
const processVideoFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Strict size limit for localStorage (e.g., 5MB)
        const MAX_SIZE_MB = 5;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            reject(new Error(`Video file is too large. Max size is ${MAX_SIZE_MB}MB. Please use a YouTube link for larger videos.`));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (err) => reject(err);
    });
};

// --- Admin Sections ---

const GeneralSettings = () => {
    const { siteData, setSiteData, showNotification } = useSiteData();
    // Using local state to handle edits before saving
    const [formState, setFormState] = useState({
        theme: siteData.theme,
        logoUrl: siteData.logoUrl,
        socialLinks: siteData.socialLinks
    });
    const [isDirty, setIsDirty] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Sync local state with global state when global state changes (e.g. on mount)
    useEffect(() => {
        setFormState({
            theme: siteData.theme,
            logoUrl: siteData.logoUrl,
            socialLinks: siteData.socialLinks
        });
    }, [siteData.theme, siteData.logoUrl, siteData.socialLinks]);

    const handleSave = () => {
        setSiteData(prev => ({
            ...prev,
            theme: formState.theme,
            logoUrl: formState.logoUrl,
            socialLinks: formState.socialLinks
        }));
        setIsDirty(false);
        showNotification('General settings saved', 'success');
    };

    const handleThemeChange = <K extends keyof SiteData['theme']['colors']>(key: K, value: string) => {
        setFormState(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                colors: {
                    ...prev.theme.colors,
                    [key]: value,
                },
            },
        }));
        setIsDirty(true);
    };

    const handleTypographyChange = (key: keyof SiteData['theme']['typography'], value: string) => {
        setFormState(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                typography: {
                    ...prev.theme.typography,
                    [key]: value,
                },
            },
        }));
        setIsDirty(true);
    };

    const handleSocialChange = (key: keyof SiteData['socialLinks'], value: string) => {
        setFormState(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [key]: value
            }
        }));
        setIsDirty(true);
    };

    const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormState(prev => ({ ...prev, logoUrl: val }));
        setIsDirty(true);
    };

    const removeLogo = () => {
        setFormState(prev => ({ ...prev, logoUrl: '' }));
        setIsDirty(true);
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setLogoError(null);
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                // Explicitly use 500x500px and 0.6 quality as requested for logos
                const compressedDataUrl = await compressImage(file, 500, 500, 0.6);
                setFormState(prev => ({ ...prev, logoUrl: compressedDataUrl }));
                setIsDirty(true);
                showNotification('Logo processed. Click Save to apply.', 'success');
            } catch (error) {
                console.error("Logo processing error:", error);
                setLogoError("Error processing logo. Please try another image.");
                showNotification('Error uploading logo', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const { theme, logoUrl, socialLinks } = formState;

    const fontOptions = [
        "Playfair Display",
        "Inter",
        "Arial",
        "Helvetica",
        "Verdana",
        "Georgia",
        "Times New Roman",
        "Courier New",
        "Trebuchet MS",
        "Impact"
    ];
    
    return (
        <div className="space-y-6">
             {/* Header with Save Button */}
             <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow">
                <div>
                    <h3 className="text-xl font-bold">General Settings</h3>
                    <p className="text-sm text-gray-500">Manage global theme, logo, and social links.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${isDirty ? 'bg-primary hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Theme Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(theme.colors).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                            <label className="capitalize w-24">{key}</label>
                            <input type="color" value={value} onChange={(e) => handleThemeChange(key as keyof SiteData['theme']['colors'], e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer"/>
                            <input type="text" value={value} onChange={(e) => handleThemeChange(key as keyof SiteData['theme']['colors'], e.target.value)} className="border p-2 rounded-md w-full focus:ring-primary focus:border-primary"/>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Typography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
                        <select
                            value={theme.typography.headingFont}
                            onChange={(e) => handleTypographyChange('headingFont', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        >
                            {fontOptions.map(font => (
                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
                        <select
                            value={theme.typography.bodyFont}
                            onChange={(e) => handleTypographyChange('bodyFont', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        >
                             {fontOptions.map(font => (
                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Logo Settings</h3>
                <div className="mb-4">
                    <AdminInput label="Logo URL" value={logoUrl} onChange={handleLogoUrlChange} placeholder="Enter URL or upload below" />
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Logo</label>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <label className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span>{isUploading ? 'Processing...' : 'Select Image'}</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </label>
                            <span className="text-sm text-gray-500">Supported: PNG, JPG, SVG, WEBP (Max 500x500)</span>
                        </div>
                        {logoError && <p className="text-red-500 text-sm">{logoError}</p>}
                    </div>
                </div>

                {logoUrl && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                         <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-medium text-gray-700">Current Logo Preview</label>
                             <button 
                                onClick={removeLogo}
                                className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                             >
                                Remove Logo
                             </button>
                         </div>
                         <div className="flex justify-center bg-white p-4 border rounded border-gray-200 border-dashed">
                            <img src={logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                         </div>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Social Media Links</h3>
                <div className="space-y-4">
                    <AdminInput label="Facebook URL" value={socialLinks.facebook} onChange={e => handleSocialChange('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                    <AdminInput label="Instagram URL" value={socialLinks.instagram} onChange={e => handleSocialChange('instagram', e.target.value)} placeholder="https://instagram.com/..." />
                    <AdminInput label="Twitter/X URL" value={socialLinks.twitter} onChange={e => handleSocialChange('twitter', e.target.value)} placeholder="https://twitter.com/..." />
                </div>
            </div>
        </div>
    );
};

const HomepageSettings = () => {
    const { siteData, setSiteData, showNotification } = useSiteData();
    const [formData, setFormData] = useState(siteData.heroSection);
    const [isDirty, setIsDirty] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Sync with external changes
    useEffect(() => {
        setFormData(siteData.heroSection);
    }, [siteData.heroSection]);

    const handleChange = (field: keyof SiteData['heroSection'], value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        setSiteData(prev => ({
            ...prev,
            heroSection: formData
        }));
        setIsDirty(false);
        showNotification('Homepage settings saved', 'success');
    };

    const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const compressedDataUrl = await compressImage(file, 1920, 1080, 0.8);
                handleChange('imageUrl', compressedDataUrl);
                showNotification('Hero image processed. Click Save to apply.', 'success');
            } catch (error) {
                console.error("Hero image processing error:", error);
                setUploadError("Error processing image. Please try another.");
                showNotification('Error uploading hero image', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    return (
         <div className="space-y-6">
             {/* Header with Save Button */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow">
                <div>
                    <h3 className="text-xl font-bold">Homepage Settings</h3>
                    <p className="text-sm text-gray-500">Customize the main banner and hero section.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${isDirty ? 'bg-primary hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
            </div>

            {/* Hero Text Content */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="font-bold mb-4 border-b pb-2">Hero Content</h4>
                <div className="space-y-4">
                    <AdminInput 
                        label="Title" 
                        value={formData.title} 
                        onChange={e => handleChange('title', e.target.value)} 
                        placeholder="e.g., Taste the Goodness of Nature"
                    />
                    <AdminTextarea 
                        label="Subtitle" 
                        value={formData.subtitle} 
                        onChange={e => handleChange('subtitle', e.target.value)} 
                        placeholder="e.g., From our farm to your table..."
                    />
                    <AdminInput 
                        label="Button Text" 
                        value={formData.buttonText} 
                        onChange={e => handleChange('buttonText', e.target.value)} 
                        placeholder="e.g., Explore Our Harvest"
                    />
                </div>
            </div>
            
            {/* Hero Image Content */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="font-bold mb-4 border-b pb-2">Hero Background Image</h4>
                <p className="text-sm text-gray-500 mb-4">High resolution (1920x1080) recommended.</p>
                
                <div className="space-y-4">
                    <AdminInput 
                        label="Background Image URL" 
                        value={formData.imageUrl} 
                        onChange={e => handleChange('imageUrl', e.target.value)} 
                        placeholder="https://example.com/hero-image.jpg"
                    />
                    
                    <div className="mt-2 border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Background Image</label>
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-4">
                                <label className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <span>{isUploading ? 'Processing...' : 'Select Image'}</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleHeroImageUpload}
                                        className="hidden"
                                        disabled={isUploading}
                                    />
                                </label>
                                <span className="text-sm text-gray-500">Max: 1920x1080px, Quality: 0.8</span>
                            </div>
                            {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                        </div>
                    </div>

                    {formData.imageUrl && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Image Preview</label>
                                 <button 
                                    onClick={() => handleChange('imageUrl', '')}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                                 >
                                    Remove Image
                                 </button>
                            </div>
                            <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-300">
                                <img src={formData.imageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const ProductManagement = () => {
    const { siteData, setSiteData, showNotification } = useSiteData();
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Refs for drag and drop reordering
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSave = () => {
        if (!editingProduct) return;
        
        if (!editingProduct.name.trim()) {
            showNotification("Product name is required.", 'error');
            return;
        }

        let productToSave = { ...editingProduct };

        // If variants exist, update the base price to the lowest variant price
        if (productToSave.variant && productToSave.variant.options.length > 0) {
            const prices = productToSave.variant.options.map(o => o.price).filter(p => p > 0);
            if (prices.length > 0) {
                productToSave.price = Math.min(...prices);
            } else {
                 productToSave.price = 0; // Default if no prices are set
            }
        } else {
            // If there are no variants, ensure the variant property is removed
            delete productToSave.variant;
        }

        // Ensure imageUrl is synced with the first image in the array if images exist
        if (productToSave.images && productToSave.images.length > 0) {
            productToSave.imageUrl = productToSave.images[0];
        } else if (productToSave.imageUrl) {
             // Migration: if only imageUrl exists, put it in images
             productToSave.images = [productToSave.imageUrl];
        }

        if (productToSave.id === 0) { // New product
            const newProduct = { ...productToSave, id: Date.now() };
            setSiteData(p => ({ ...p, products: [...p.products, newProduct] }));
            showNotification('Product created successfully', 'success');
        } else { // Existing product
            setSiteData(p => ({ ...p, products: p.products.map(prod => prod.id === productToSave.id ? productToSave : prod) }));
            showNotification('Product updated successfully', 'success');
        }
        setEditingProduct(null);
        setUploadError(null);
        setVideoUploadError(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setSiteData(p => ({
                ...p,
                products: p.products.filter(prod => prod.id !== id),
                featuredProductIds: p.featuredProductIds.filter(fid => fid !== id)
            }));
            showNotification('Product deleted successfully', 'success');
        }
    };

    const handleToggleFeatured = (productId: number) => {
        setSiteData(prev => {
            const isFeatured = prev.featuredProductIds.includes(productId);
            const newFeaturedIds = isFeatured
                ? prev.featuredProductIds.filter(id => id !== productId)
                : [...prev.featuredProductIds, productId];
            
            return { ...prev, featuredProductIds: newFeaturedIds };
        });
    };

    const handleMultiImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const files = event.target.files;
        if (files && files.length > 0 && editingProduct) {
            setIsUploading(true);
            const newImages: string[] = [];
            try {
                for (let i = 0; i < files.length; i++) {
                    const compressed = await compressImage(files[i]);
                    newImages.push(compressed);
                }
                
                setEditingProduct(prev => {
                    if (!prev) return null;
                    const updatedImages = [...(prev.images || []), ...newImages];
                    return {
                        ...prev,
                        images: updatedImages,
                        imageUrl: updatedImages[0] // Sync main image preview immediately
                    };
                });
                showNotification(`${newImages.length} images uploaded successfully`, 'success');
            } catch (error) {
                console.error("Image processing error:", error);
                setUploadError("Error processing one or more images.");
                showNotification('Error uploading images', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const removeImage = (index: number) => {
        if (!editingProduct || !editingProduct.images) return;
        const newImages = [...editingProduct.images];
        newImages.splice(index, 1);
        setEditingProduct({
            ...editingProduct,
            images: newImages,
            imageUrl: newImages.length > 0 ? newImages[0] : ''
        });
    };

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && editingProduct && editingProduct.images) {
            const _images = [...editingProduct.images];
            const draggedItemContent = _images[dragItem.current];
            _images.splice(dragItem.current, 1);
            _images.splice(dragOverItem.current, 0, draggedItemContent);

            setEditingProduct({
                ...editingProduct,
                images: _images,
                imageUrl: _images[0]
            });
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setVideoUploadError(null);
        const file = event.target.files?.[0];
        if (file && editingProduct) {
            try {
                const videoDataUrl = await processVideoFile(file);
                setEditingProduct(prev => prev ? ({ ...prev, videoUrl: videoDataUrl }) : null);
                showNotification('Video uploaded successfully', 'success');
            } catch (error: any) {
                console.error("Video processing error:", error);
                setVideoUploadError(error.message || "Error processing video.");
                showNotification(error.message || 'Error uploading video', 'error');
            }
        }
    };
    
    // --- Variant editing functions ---
    const handleOptionChange = (index: number, field: keyof Omit<ProductVariantOption, 'id'>, value: string | number) => {
        if (!editingProduct || !editingProduct.variant) return;
        const newOptions = [...editingProduct.variant.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setEditingProduct({
            ...editingProduct,
            variant: { ...editingProduct.variant, options: newOptions }
        });
    };

    const removeOption = (id: string) => {
        if (!editingProduct || !editingProduct.variant) return;
        const newOptions = editingProduct.variant.options.filter((opt) => opt.id !== id);
        
        if (newOptions.length === 0) {
            // If all options are removed, remove the variant object itself
            const { variant, ...productWithoutVariant } = editingProduct;
            setEditingProduct(productWithoutVariant);
        } else {
             setEditingProduct({
                ...editingProduct,
                variant: { ...editingProduct.variant, options: newOptions }
            });
        }
    };

    const addOption = () => {
        if (!editingProduct || !editingProduct.variant) return;
        const newOptions = [...editingProduct.variant.options, { id: `new_${Date.now()}`, value: '', price: 0 }];
        setEditingProduct({
            ...editingProduct,
            variant: { ...editingProduct.variant, options: newOptions }
        });
    };
    // --- End variant editing functions ---

    if (editingProduct) {
        const hasVariants = !!editingProduct.variant && editingProduct.variant.options.length > 0;
        // Ensure images array is populated for editing
        const currentImages = editingProduct.images && editingProduct.images.length > 0 
            ? editingProduct.images 
            : (editingProduct.imageUrl ? [editingProduct.imageUrl] : []);

        return (
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h3 className="text-xl font-bold">{editingProduct.id === 0 ? 'Add New Product' : 'Edit Product'}</h3>
                <AdminInput label="Name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <AdminInput label="Category" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                
                <AdminInput 
                    label="Tags (comma separated)" 
                    placeholder="healthy, organic, snack"
                    value={editingProduct.tags?.join(', ') || ''} 
                    onChange={e => setEditingProduct({
                        ...editingProduct, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })} 
                />

                <div>
                    <AdminInput 
                        label="Base Price" 
                        type="number" 
                        step="0.01"
                        value={editingProduct.price} 
                        onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
                        disabled={hasVariants}
                        title={hasVariants ? "Base price is automatically set to the lowest variant price." : ""}
                    />
                    {hasVariants && <p className="text-xs text-gray-500 mt-1">Base price is managed by variants.</p>}
                </div>
                
                {/* Multi-Image Upload Section */}
                <div className="border p-4 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-2">Product Images</h4>
                    <p className="text-xs text-gray-500 mb-3">Upload multiple images. Drag and drop to reorder. The first image will be the main product image.</p>
                    
                    <div className="mb-4">
                        <label className={`block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="text-gray-600 font-medium">{isUploading ? 'Processing...' : 'Click to Upload Images'}</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                onChange={handleMultiImageUpload}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                        {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
                    </div>

                    {currentImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {currentImages.map((img, index) => (
                                <div 
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="relative group border rounded-md overflow-hidden bg-white cursor-move"
                                >
                                    <div className="aspect-square">
                                        <img src={img} alt={`Product ${index}`} className="w-full h-full object-contain" />
                                    </div>
                                    {index === 0 && (
                                        <div className="absolute top-0 left-0 bg-primary text-white text-xs px-2 py-1 font-bold">Main</div>
                                    )}
                                    <button 
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Remove Image"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Video Section */}
                <div className="border p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Product Video</h4>
                    <AdminInput 
                        label="Video URL (YouTube, Vimeo, or MP4)" 
                        value={editingProduct.videoUrl || ''} 
                        onChange={e => {
                            setEditingProduct({...editingProduct, videoUrl: e.target.value});
                            setVideoUploadError(null);
                        }} 
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Video (Max 5MB)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                                <span>Choose Video</span>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                />
                            </label>
                            <span className="text-sm text-gray-500">Small clips only (WebM/MP4)</span>
                        </div>
                        {videoUploadError && <p className="text-red-500 text-sm mt-1">{videoUploadError}</p>}
                    </div>

                     {editingProduct.videoUrl && (
                        <div className="mt-2">
                             <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video Active</label>
                                <button 
                                    onClick={() => setEditingProduct({...editingProduct, videoUrl: ''})}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                                >
                                    Remove Video
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{editingProduct.videoUrl}</p>
                        </div>
                    )}
                </div>

                <AdminTextarea label="Description" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                
                {/* --- Variant Management UI --- */}
                <div className="mt-6 pt-6 border-t">
                    <h4 className="text-lg font-bold mb-2">Product Variants</h4>
                    {!editingProduct.variant ? (
                        <button 
                            onClick={() => setEditingProduct({ ...editingProduct, variant: { name: 'Size', options: [{ id: `new_${Date.now()}`, value: '', price: 0 }] } })}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
                        >
                            Add Variants
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <AdminInput 
                                label="Variant Name (e.g., Size, Color)" 
                                value={editingProduct.variant.name} 
                                onChange={e => setEditingProduct({ ...editingProduct, variant: { ...editingProduct.variant!, name: e.target.value }})}
                            />
                            <div className="space-y-3">
                                {editingProduct.variant.options.map((option, index) => (
                                    <div key={option.id} className="flex items-end gap-4 p-3 bg-gray-50 rounded-md border">
                                        <div className="flex-1">
                                            <AdminInput 
                                                label={`Option ${index + 1} Value`}
                                                placeholder="e.g., 250g" 
                                                value={option.value}
                                                onChange={e => handleOptionChange(index, 'value', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <AdminInput 
                                                label="Price" 
                                                type="number"
                                                step="0.01"
                                                value={option.price}
                                                onChange={e => handleOptionChange(index, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => removeOption(option.id)} 
                                            className="bg-red-500 text-white h-10 w-10 flex items-center justify-center rounded-md hover:bg-red-600"
                                            aria-label="Remove option"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={addOption}
                                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300"
                            >
                                Add Another Option
                            </button>
                        </div>
                    )}
                </div>
                {/* --- End Variant Management UI --- */}

                <div className="flex space-x-2 pt-4">
                    <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-md">Save Product</button>
                    <button onClick={() => { setEditingProduct(null); setUploadError(null); setVideoUploadError(null); }} className="bg-gray-300 px-4 py-2 rounded-md">Cancel</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Products</h3>
                <button onClick={() => { setEditingProduct({id: 0, name: '', category: '', price: 0, description: '', imageUrl: '', images: [], videoUrl: ''}); setUploadError(null); }} className="bg-primary text-white px-4 py-2 rounded-md">Add Product</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Image</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Price</th>
                            <th className="p-2 text-center">Featured</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {siteData.products.map(product => (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">
                                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded border border-gray-200" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'} />
                                </td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.category}</td>
                                <td className="p-2">
                                    {product.variant ? `From $${product.price.toFixed(2)}` : `$${product.price.toFixed(2)}`}
                                </td>
                                <td className="p-2 text-center">
                                     <input 
                                        type="checkbox" 
                                        checked={siteData.featuredProductIds.includes(product.id)} 
                                        onChange={() => handleToggleFeatured(product.id)}
                                        className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer accent-primary"
                                    />
                                </td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => { setEditingProduct(product); setUploadError(null); }} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const BlogManagement = () => {
    const { siteData, setSiteData, showNotification } = useSiteData();
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = () => {
        if (!editingPost) return;
        if (editingPost.id === 0) { // New post
            const newPost = { ...editingPost, id: Date.now() };
            setSiteData(p => ({ ...p, blogPosts: [...p.blogPosts, newPost] }));
            showNotification('Post created successfully', 'success');
        } else { // Existing post
            setSiteData(p => ({ ...p, blogPosts: p.blogPosts.map(post => post.id === editingPost.id ? editingPost : post) }));
            showNotification('Post updated successfully', 'success');
        }
        setEditingPost(null);
        setVideoUploadError(null);
        setImageUploadError(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            setSiteData(p => ({ ...p, blogPosts: p.blogPosts.filter(post => post.id !== id) }));
            showNotification('Post deleted successfully', 'success');
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setImageUploadError(null);
        const file = event.target.files?.[0];
        if (file && editingPost) {
            setIsUploading(true);
            try {
                const compressedDataUrl = await compressImage(file, 1200, 800, 0.8);
                setEditingPost(prev => prev ? ({ ...prev, imageUrl: compressedDataUrl }) : null);
                showNotification('Image uploaded successfully', 'success');
            } catch (error) {
                console.error("Image processing error:", error);
                setImageUploadError("Error processing image. Please try another.");
                showNotification('Error uploading image', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setVideoUploadError(null);
        const file = event.target.files?.[0];
        if (file && editingPost) {
            try {
                const videoDataUrl = await processVideoFile(file);
                setEditingPost(prev => prev ? ({ ...prev, videoUrl: videoDataUrl }) : null);
                showNotification('Video uploaded successfully', 'success');
            } catch (error: any) {
                console.error("Video processing error:", error);
                setVideoUploadError(error.message || "Error processing video.");
                showNotification(error.message || 'Error uploading video', 'error');
            }
        }
    };

    if (editingPost) {
        return (
             <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h3 className="text-xl font-bold">{editingPost.id === 0 ? 'Add New Post' : 'Edit Post'}</h3>
                <AdminInput label="Title" value={editingPost.title} onChange={e => setEditingPost({...editingPost, title: e.target.value})} />
                <AdminInput label="Author" value={editingPost.author} onChange={e => setEditingPost({...editingPost, author: e.target.value})} />
                <AdminInput label="Date" value={editingPost.date} onChange={e => setEditingPost({...editingPost, date: e.target.value})} />
                
                {/* Updated Image Section */}
                <div className="border p-4 rounded-md bg-gray-50">
                    <h4 className="font-semibold mb-2">Featured Image</h4>
                    <AdminInput label="Image URL" value={editingPost.imageUrl} onChange={e => setEditingPost({...editingPost, imageUrl: e.target.value})} />
                    
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Image (Max 1200x800)</label>
                        <div className="flex items-center gap-4">
                            <label className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span>{isUploading ? 'Processing...' : 'Upload Image'}</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        {imageUploadError && <p className="text-red-500 text-sm mt-1">{imageUploadError}</p>}
                    </div>

                    {editingPost.imageUrl && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                            <div className="relative h-48 w-full overflow-hidden rounded-md border border-gray-300 bg-gray-100">
                                <img 
                                    src={editingPost.imageUrl} 
                                    alt="Post Preview" 
                                    className="h-full w-full object-cover" 
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                                />
                                <button 
                                    onClick={() => setEditingPost({...editingPost, imageUrl: ''})}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                                    title="Remove Image"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Video Section for Blog */}
                 <div className="border p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Video Content</h4>
                    <AdminInput 
                        label="Video URL (YouTube, Vimeo, or MP4)" 
                        value={editingPost.videoUrl || ''} 
                        onChange={e => setEditingPost({...editingPost, videoUrl: e.target.value})} 
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Video (Max 5MB)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                                <span>Choose Video</span>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                />
                            </label>
                            <span className="text-sm text-gray-500">Small clips only (WebM/MP4)</span>
                        </div>
                        {videoUploadError && <p className="text-red-500 text-sm mt-1">{videoUploadError}</p>}
                    </div>
                     {editingPost.videoUrl && (
                        <div className="mt-2">
                             <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video Active</label>
                                <button 
                                    onClick={() => setEditingPost({...editingPost, videoUrl: ''})}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                                >
                                    Remove Video
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{editingPost.videoUrl}</p>
                        </div>
                    )}
                </div>

                <AdminTextarea label="Content" value={editingPost.content} onChange={e => setEditingPost({...editingPost, content: e.target.value})} />
                <div className="flex space-x-2">
                    <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-md">Save</button>
                    <button onClick={() => { setEditingPost(null); setVideoUploadError(null); setImageUploadError(null); }} className="bg-gray-300 px-4 py-2 rounded-md">Cancel</button>
                </div>
            </div>
        )
    }

    return (
         <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Blog Posts</h3>
                <button onClick={() => setEditingPost({id: 0, title: '', author: '', date: new Date().toLocaleDateString('en-CA'), imageUrl: '', content: ''})} className="bg-primary text-white px-4 py-2 rounded-md">Add Post</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                     <thead>
                        <tr className="border-b"><th className="p-2">Title</th><th className="p-2">Author</th><th className="p-2">Date</th><th className="p-2">Actions</th></tr>
                    </thead>
                    <tbody>
                        {siteData.blogPosts.map(post => (
                            <tr key={post.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{post.title}</td>
                                <td className="p-2">{post.author}</td>
                                <td className="p-2">{post.date}</td>
                                <td className="p-2 flex space-x-2">
                                    <button onClick={() => setEditingPost(post)} className="text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const AboutSettings = () => {
    const { siteData, setSiteData, showNotification } = useSiteData();
    const [formData, setFormData] = useState(siteData.pageContent.about);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Reset form data if siteData changes externally
    useEffect(() => {
        setFormData(siteData.pageContent.about);
    }, [siteData.pageContent.about]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        setSiteData(prev => ({
            ...prev,
            pageContent: {
                ...prev.pageContent,
                about: formData
            }
        }));
        setIsDirty(false);
        showNotification('About page settings saved', 'success');
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null);
        const file = event.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                // Use reasonably large dimensions for the about page hero
                const compressedDataUrl = await compressImage(file, 1200, 800, 0.8);
                handleChange('imageUrl', compressedDataUrl);
                showNotification('Image processed. Click Save to apply.', 'success');
            } catch (error) {
                console.error("Image processing error:", error);
                setUploadError("Error processing image. Please try another.");
                showNotification('Error uploading image', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold">About Page Settings</h3>
                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${isDirty ? 'bg-primary hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
            </div>
            
            <div className="space-y-4">
                <AdminInput label="Title" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
                <AdminTextarea label="Story" value={formData.story} onChange={e => handleChange('story', e.target.value)} />
                <AdminTextarea label="Mission" value={formData.mission} onChange={e => handleChange('mission', e.target.value)} />
                <AdminInput label="Values" value={formData.values} onChange={e => handleChange('values', e.target.value)} />
                
                <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">About Page Image</label>
                    <AdminInput label="Image URL" value={formData.imageUrl || ''} onChange={e => handleChange('imageUrl', e.target.value)} />
                    
                    <div className="mt-2">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Image</label>
                        <div className="flex items-center gap-4">
                            <label className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span>{isUploading ? 'Processing...' : 'Upload New Image'}</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                            </label>
                            <span className="text-sm text-gray-500">Max: 1200x800px</span>
                        </div>
                        {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
                    </div>
                    {formData.imageUrl && (
                        <div className="mt-4 p-2 border rounded-md bg-gray-50">
                            <p className="text-xs text-gray-500 mb-2">Preview:</p>
                            <img src={formData.imageUrl} alt="About Preview" className="h-32 object-cover rounded" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContactSettings = () => {
    const { siteData, setSiteData, showNotification } = useSiteData();
    const [formData, setFormData] = useState(siteData.pageContent.contact);
    const [isDirty, setIsDirty] = useState(false);

    // Reset form data if siteData changes externally
    useEffect(() => {
        setFormData(siteData.pageContent.contact);
    }, [siteData.pageContent.contact]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        setSiteData(prev => ({
            ...prev,
            pageContent: {
                ...prev.pageContent,
                contact: formData
            }
        }));
        setIsDirty(false);
        showNotification('Contact settings saved', 'success');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
             <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold">Contact Page Settings</h3>
                <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${isDirty ? 'bg-primary hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                    {isDirty ? 'Save Changes' : 'Saved'}
                </button>
            </div>

            <div className="space-y-4">
                <AdminInput label="Page Title" value={formData.title} onChange={e => handleChange('title', e.target.value)} />
                <AdminInput label="Address" value={formData.address} onChange={e => handleChange('address', e.target.value)} />
                <AdminInput label="Phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                <AdminInput label="Email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                <AdminInput label="Business Hours" value={formData.businessHours || ''} onChange={e => handleChange('businessHours', e.target.value)} placeholder="e.g. Mon-Fri 9am-6pm" />
            </div>
        </div>
    );
};

// Main AdminDashboard Component
const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState<AdminSection>('settings');

    const renderSection = () => {
        switch (activeSection) {
            case 'settings': return <GeneralSettings />;
            case 'homepage': return <HomepageSettings />;
            case 'products': return <ProductManagement />;
            case 'blog': return <BlogManagement />;
            case 'about': return <AboutSettings />;
            case 'contact': return <ContactSettings />;
            default: return <GeneralSettings />;
        }
    };
    
    const navItems = [
        { id: 'settings', label: 'General Settings', icon: <SettingsIcon className="w-5 h-5 mr-3"/> },
        { id: 'homepage', label: 'Homepage', icon: <HomeIcon className="w-5 h-5 mr-3"/> },
        { id: 'products', label: 'Products', icon: <PackageIcon className="w-5 h-5 mr-3"/> },
        { id: 'blog', label: 'Blog', icon: <EditIcon className="w-5 h-5 mr-3"/> },
        { id: 'about', label: 'About', icon: <FileTextIcon className="w-5 h-5 mr-3"/> },
        { id: 'contact', label: 'Contact', icon: <PhoneIcon className="w-5 h-5 mr-3"/> },
    ]

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-gray-700">Admin Panel</div>
                <nav className="flex-grow">
                    <ul>
                        {navItems.map(item => (
                             <li key={item.id}>
                                <a
                                    onClick={() => setActiveSection(item.id as AdminSection)}
                                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-700 transition-colors ${activeSection === item.id ? 'bg-primary' : ''}`}
                                >
                                    {item.icon} {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            {/* Main Content */}
            <main className="flex-1 p-10">
                <h1 className="text-3xl font-bold mb-8">
                  {navItems.find(item => item.id === activeSection)?.label}
                </h1>
                {renderSection()}
            </main>
        </div>
    );
};

export default AdminDashboard;
