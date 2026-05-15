import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  ArrowRight, 
  Instagram, 
  Facebook, 
  Mail, 
  Phone,
  MessageCircle,
  Search,
  ChevronRight,
  Heart,
  Settings,
  Plus,
  Trash2,
  ChevronLeft,
  Camera,
  Edit2,
  Tag,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  isUserAdmin, 
  ADMIN_EMAILS,
  OperationType,
  handleFirestoreError
} from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { NAV_ITEMS, PRODUCTS as INITIAL_PRODUCTS, GALLERY_IMAGES as INITIAL_GALLERY, COLORS } from './constants';
import { Product, Coupon } from './types';

// --- Shared Components ---

const ScrollingBanner = ({ html, speed = 20 }: { html: string; speed?: number }) => {
  if (!html || html.trim() === '') return null;
  
  return (
    <div 
      className="bg-black text-white text-[9px] md:text-[11px] uppercase tracking-[0.3em] py-3 h-10 relative z-[100] flex items-center overflow-hidden"
    >
      <div 
        className="flex animate-marquee whitespace-nowrap min-w-max"
        style={{ animationDuration: `${speed}s` }}
      >
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="flex items-center"
          >
            <div className="font-medium inline-flex px-16" dangerouslySetInnerHTML={{ __html: html }} />
            <span className="opacity-30 mx-4 text-xs">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfiniteMarquee = ({ items }: { items: string[] }) => {
  const [isPaused, setIsPaused] = useState(false);
  const duplicatedItems = [...items, ...items, ...items];
  
  return (
    <div 
      className="overflow-hidden whitespace-nowrap py-12 bg-white flex relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div 
        className="flex gap-4 min-w-max px-4 animate-marquee"
        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
      >
        {duplicatedItems.map((img, i) => (
          <div key={i} className="w-[280px] md:w-[400px] h-[350px] md:h-[500px] flex-shrink-0 bg-brand-beige overflow-hidden rounded-[32px] group transition-all duration-500">
            <img 
              src={img} 
              alt={`Gallery ${i}`} 
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="text-center mb-20 md:mb-24 px-4">
    <h2 className="font-serif text-4xl md:text-5xl mb-6 tracking-tight">{title}</h2>
    {subtitle && <p className="text-muted-foreground font-sans max-w-lg mx-auto text-sm md:text-base">{subtitle}</p>}
    <div className="w-12 h-[1px] bg-black mx-auto mt-8"></div>
  </div>
);

const ImageSlider = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (!images || images.length === 0) return <div className="w-full h-full bg-brand-beige" />;

  return (
    <div className="relative group/slider w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      
      {images.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ProductCard = ({ 
  product, 
  onInquiry, 
  onClick 
}: { 
  product: Product, 
  onInquiry: (p: Product) => void, 
  onClick: (p: Product) => void,
  key?: React.Key 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group cursor-pointer flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(product)}
    >
      <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-brand-beige mb-3 md:mb-4 rounded-2xl md:rounded-none">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {product.newCollection && (
          <span className="absolute top-2 left-2 md:top-4 md:left-4 bg-white px-2 md:px-3 py-1 text-[8px] md:text-[10px] uppercase tracking-widest font-bold">New</span>
        )}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/5 hidden md:flex items-end justify-center p-6"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onInquiry(product);
                }}
                className="w-full bg-white text-black py-3 text-xs uppercase tracking-widest font-medium border border-black/10 hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                {product.price === 'Inquiry' ? 'Enquire' : 'Add to Cart'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            alert('Added to wishlist!');
          }}
          className="absolute top-2 right-2 md:top-4 md:right-4 p-1.5 md:p-2 bg-white/80 backdrop-blur-sm rounded-full md:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Heart size={14} className="md:w-4 md:h-4" />
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{product.category}</p>
        <h3 className="font-serif text-sm md:text-lg mb-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2 mt-auto">
          <p className="font-sans text-xs md:text-base font-bold text-black">{product.price}</p>
          {product.oldPrice && (
            <p className="font-sans text-[10px] md:text-xs text-muted-foreground line-through opacity-60">{product.oldPrice}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetailsModal = ({ product, onClose, onAction, coupons }: { product: Product, onClose: () => void, onAction: (p: Product) => void, coupons: Coupon[] }) => {
  const applicableCoupon = coupons.find(c => 
    (c.appliesTo === 'all') || 
    (c.appliesTo === 'category' && c.targetId === product.category) || 
    (c.appliesTo === 'product' && c.targetId === product.id)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl grid grid-cols-1 md:grid-cols-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/5] md:aspect-auto">
          <ImageSlider images={product.images} />
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full md:hidden z-10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-muted-foreground">{product.category}</p>
            <button onClick={onClose} className="hidden md:block text-muted-foreground hover:text-black transition-colors">
              <X size={24} strokeWidth={1} />
            </button>
          </div>
          
          <h2 className="font-serif text-4xl mb-4 tracking-tight">{product.name}</h2>
          <div className="flex items-center gap-4 mb-8">
            <p className="text-3xl font-sans font-bold text-black">{product.price}</p>
            {product.oldPrice && (
              <p className="text-xl font-sans text-muted-foreground line-through opacity-50">{product.oldPrice}</p>
            )}
          </div>
          
          <div className="w-12 h-[1px] bg-black/10 mb-8"></div>
          
          <p className="text-muted-foreground leading-relaxed mb-10 font-light italic">
            "{product.description}"
          </p>
          
           {applicableCoupon && (
             <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
               <div className="bg-green-500 p-2 rounded-full text-white">
                 <Tag size={14} />
               </div>
               <p className="text-xs font-medium text-green-700 uppercase tracking-widest">
                 Coupon Available: Use "{applicableCoupon.code}" for {applicableCoupon.discountType === 'fixed' ? `৳${applicableCoupon.discountValue}` : `${applicableCoupon.discountValue}%`} off!
               </p>
             </div>
           )}
          
          <div className="space-y-4">
            <button 
              onClick={() => {
                onAction(product);
                onClose();
              }}
              className="w-full bg-black text-white py-5 rounded-full text-xs uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {product.price === 'Inquiry' ? (
                <>Send Inquiry <Mail size={16} /></>
              ) : (
                <>Add to Cart <ShoppingBag size={16} /></>
              )}
            </button>
            <button className="w-full border border-black/10 text-black py-5 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all">
              Add to Wishlist
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-black/5 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              In Stock
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="w-2 h-2 bg-brand-beige rounded-full"></span>
              Ethically Made
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Admin Panel Components ---

const AdminPanel = ({ 
  products, 
  categories, 
  galleryImages,
  bannerText,
  onSaveProduct, 
  onDeleteProduct,
  onSaveCategory,
  onDeleteCategory,
  onSaveGallery,
  onDeleteGalleryImage,
  onSaveBanner,
  onSaveBannerSpeed,
  bannerSpeed,
  coupons,
  onSaveCoupon,
  onDeleteCoupon,
  onLogout,
  onClose
}: { 
  products: Product[],
  categories: string[],
  galleryImages: {id: string, url: string}[],
  bannerText: string,
  onSaveProduct: (p: Product) => void,
  onDeleteProduct: (id: string) => void,
  onSaveCategory: (old: string, updated: string) => void,
  onDeleteCategory: (cat: string) => void,
  onSaveGallery: (url: string) => void,
  onDeleteGalleryImage: (url: string) => void,
  onSaveBanner: (text: string) => void,
  onSaveBannerSpeed: (speed: number) => void,
  bannerSpeed: number,
  coupons: Coupon[],
  onSaveCoupon: (coupon: Coupon) => void,
  onDeleteCoupon: (id: string) => void,
  onLogout: () => void,
  onClose: () => void 
}) => {
  const [activeTab, setActiveTab ] = useState<'products' | 'categories' | 'gallery' | 'settings' | 'coupons'>('products');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [newCat, setNewCat] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [catBeingEdited, setCatBeingEdited] = useState<{old: string, current: string} | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [galleryImgToDelete, setGalleryImgToDelete] = useState<string | null>(null);
  const [tempBanner, setTempBanner] = useState(bannerText);
  const [tempSpeed, setTempSpeed] = useState(bannerSpeed);

  const [couponProductSearch, setCouponProductSearch] = useState('');

  const filteredProductsForCoupon = products.filter(p => 
    p.name.toLowerCase().includes(couponProductSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(couponProductSearch.toLowerCase())
  );

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct?.name && editingProduct?.price) {
      onSaveProduct({
        ...editingProduct as Product,
        id: editingProduct.id || Math.random().toString(36).substr(2, 9),
        images: editingProduct.images || ['https://picsum.photos/seed/new/600/800'],
      });
      setEditingProduct(null);
    }
  };

  const handleCategoryRename = (oldName: string) => {
    if (catBeingEdited && catBeingEdited.current.trim()) {
      onSaveCategory(oldName, catBeingEdited.current.trim());
      setCatBeingEdited(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-[200] bg-white flex flex-col pt-20"
    >
      <div className="p-8 border-b border-black/5 flex items-center justify-between">
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('products')}
            className={`font-serif text-2xl whitespace-nowrap ${activeTab === 'products' ? 'text-black' : 'text-black/30'}`}
          >
            Manage Products
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`font-serif text-2xl whitespace-nowrap ${activeTab === 'categories' ? 'text-black' : 'text-black/30'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`font-serif text-2xl whitespace-nowrap ${activeTab === 'gallery' ? 'text-black' : 'text-black/30'}`}
          >
            Gallery
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`font-serif text-2xl whitespace-nowrap ${activeTab === 'settings' ? 'text-black' : 'text-black/30'}`}
          >
            Settings
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`font-serif text-2xl whitespace-nowrap ${activeTab === 'coupons' ? 'text-black' : 'text-black/30'}`}
          >
            Coupons
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
          <button onClick={onClose} className="p-4 flex-shrink-0"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <button 
                onClick={() => setEditingProduct({})}
                className="w-full p-4 border-2 border-dashed border-black/10 rounded-xl flex items-center justify-center gap-2 hover:border-black/30 transition-all font-bold"
              >
                <Plus size={18} /> Add New Product
              </button>
              
              {products.map(p => (
                <div key={p.id} className="flex gap-4 p-4 bg-brand-cream rounded-xl group">
                  <img src={p.images[0]} className="w-16 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-bold">{p.name}</h4>
                    <p className="text-sm opacity-60">{p.category} • {p.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingProduct(p)} className="p-2 hover:bg-black hover:text-white transition-colors rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteProduct(p.id)} className="p-2 hover:bg-red-500 hover:text-white transition-colors rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              {editingProduct && (
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleProductSubmit}
                  className="sticky top-0 bg-brand-cream p-8 rounded-2xl space-y-6 space-y-4"
                >
                  <h3 className="font-serif text-2xl">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Name</label>
                    <input 
                      value={editingProduct.name || ''} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full p-4 rounded-xl border border-black/5" 
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Offer Price</label>
                      <input 
                        value={editingProduct.price || ''} 
                        placeholder="৳ or Inquiry"
                        onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                        className="w-full p-4 rounded-xl border border-black/5" 
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Old Price (Optional)</label>
                      <input 
                        value={editingProduct.oldPrice || ''} 
                        placeholder="৳"
                        onChange={e => setEditingProduct({...editingProduct, oldPrice: e.target.value})}
                        className="w-full p-4 rounded-xl border border-black/5" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Category</label>
                      <select 
                        value={editingProduct.category || ''} 
                        onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                        className="w-full p-4 rounded-xl border border-black/5"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Images (comma separated)</label>
                    <textarea 
                      value={editingProduct.images?.join(', ') || ''} 
                      onChange={e => setEditingProduct({...editingProduct, images: e.target.value.split(',').map(s => s.trim())})}
                      className="w-full p-4 rounded-xl border border-black/5 h-24" 
                      placeholder="URL 1, URL 2..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Description</label>
                    <textarea 
                      value={editingProduct.description || ''} 
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full p-4 rounded-xl border border-black/5 h-32" 
                    />
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]">Save Product</button>
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 border border-black/10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                  </div>
                </motion.form>
              )}
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="max-w-2xl space-y-8">
            <div className="flex gap-4">
              <input 
                value={newCat} 
                onChange={e => setNewCat(e.target.value)}
                placeholder="New category name..."
                className="flex-1 p-4 rounded-xl border border-black/5" 
              />
              <button 
                onClick={() => {
                  if (newCat && !categories.includes(newCat)) { onSaveCategory('', newCat); setNewCat(''); }
                  else if (categories.includes(newCat)) alert('Category already exists');
                }}
                className="bg-black text-white px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Add
              </button>
            </div>

            <div className="space-y-4">
              {categories.map(c => (
                <div key={c} className="flex items-center justify-between p-4 bg-brand-cream rounded-xl">
                  {catBeingEdited?.old === c ? (
                    <div className="flex-1 flex gap-2">
                      <input 
                        value={catBeingEdited.current}
                        onChange={e => setCatBeingEdited({...catBeingEdited, current: e.target.value})}
                        className="flex-1 p-2 border rounded-lg"
                        autoFocus
                      />
                      <button onClick={() => handleCategoryRename(c)} className="bg-black text-white px-4 rounded-lg text-[10px] uppercase font-bold">Save</button>
                      <button onClick={() => setCatBeingEdited(null)} className="border p-2 rounded-lg text-[10px] uppercase font-bold text-muted-foreground">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="font-serif text-xl">{c}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCatBeingEdited({ old: c, current: c })}
                          className="p-2 hover:bg-black hover:text-white transition-colors rounded-lg"
                        ><Edit2 size={16} /></button>
                        <button 
                          onClick={() => setCatToDelete(c)}
                          className="p-2 hover:bg-red-500 hover:text-white transition-colors rounded-lg"
                        ><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Inline Confirmation for Deletion */}
            <AnimatePresence>
              {catToDelete && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6"
                  >
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                      <Trash2 size={32} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl mb-2">Delete category?</h3>
                      <p className="text-muted-foreground text-sm">This will permanently remove "{catToDelete}" and all products belonging to it.</p>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => { onDeleteCategory(catToDelete); setCatToDelete(null); }}
                        className="flex-1 bg-red-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => setCatToDelete(null)}
                        className="flex-1 border border-black/10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : activeTab === 'gallery' ? (
          <div className="max-w-4xl space-y-8">
            <div className="flex gap-4">
              <input 
                value={newGalleryUrl} 
                onChange={e => setNewGalleryUrl(e.target.value)}
                placeholder="Photo URL..."
                className="flex-1 p-4 rounded-xl border border-black/5" 
              />
              <button 
                onClick={() => {
                  if (newGalleryUrl) { onSaveGallery(newGalleryUrl); setNewGalleryUrl(''); }
                }}
                className="bg-black text-white px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Add to Gallery
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative aspect-[3/4] group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                  <img src={img.url} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGalleryImgToDelete(img.id);
                      }}
                      className="p-2 bg-white text-red-500 rounded-full shadow-xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 z-20 cursor-pointer"
                      title="Delete Image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Gallery Image Delete Confirmation */}
            <AnimatePresence>
              {galleryImgToDelete !== null && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-2xl">
                       <img src={galleryImages.find(g => g.id === galleryImgToDelete)?.url} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl mb-2">Remove from gallery?</h3>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => { onDeleteGalleryImage(galleryImgToDelete); setGalleryImgToDelete(null); }}
                        className="flex-1 bg-red-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => setGalleryImgToDelete(null)}
                        className="flex-1 border border-black/10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl space-y-12 text-black">
            <h3 className="font-serif text-3xl">General Settings</h3>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold block mb-4 opacity-70">Scrolling Banner Content</label>
                <div 
                  contentEditable
                  onInput={(e) => {
                    const newHtml = e.currentTarget.innerHTML;
                    setTempBanner(newHtml);
                    onSaveBanner(newHtml);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: bannerText }}
                  className="w-full p-6 rounded-2xl border border-black/10 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-black/20 bg-black text-white text-xs md:text-sm uppercase tracking-widest whitespace-pre-wrap overflow-y-auto leading-relaxed"
                />
                <p className="mt-4 text-[10px] text-muted-foreground italic font-medium">Text updates instantly on the site. Delete all text to hide the banner completely.</p>
              </div>

              <div className="pt-8 border-t border-black/5">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold block opacity-70">Scroll Speed</label>
                    <p className="text-[9px] text-muted-foreground mt-1">Adjust how fast the text moves across the screen</p>
                  </div>
                  <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full font-bold tabular-nums">{tempSpeed}s</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Fast</span>
                  <input 
                    type="range" 
                    min="5" 
                    max="120" 
                    step="1"
                    value={tempSpeed}
                    onChange={(e) => {
                      const speed = parseInt(e.target.value);
                      setTempSpeed(speed);
                      onSaveBannerSpeed(speed);
                    }}
                    className="flex-1 h-1.5 bg-black/5 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Slow</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'coupons' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-black">
            <div className="space-y-6">
              <button 
                onClick={() => setEditingCoupon({ code: '', discountType: 'fixed', discountValue: 0, appliesTo: 'all' })}
                className="w-full p-4 border-2 border-dashed border-black/10 rounded-xl flex items-center justify-center gap-2 hover:border-black/30 transition-all font-bold"
              >
                <Plus size={18} /> Create New Coupon
              </button>
              
              {coupons.map(c => (
                <div key={c.id} className="flex gap-4 p-4 bg-brand-cream rounded-xl group items-center">
                  <div className="bg-black text-white p-3 rounded-lg">
                    <Tag size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold tracking-widest">{c.code}</h4>
                    <p className="text-xs opacity-60">
                      {c.discountType === 'fixed' ? `৳${c.discountValue}` : `${c.discountValue}%`} off • 
                      Applies to {c.appliesTo === 'all' ? 'All Products' : c.appliesTo === 'category' ? `Category: ${c.targetId}` : `Product: ${products.find(p => p.id === c.targetId)?.name || c.targetId}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingCoupon(c)} className="p-2 hover:bg-black hover:text-white transition-colors rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteCoupon(c.id)} className="p-2 hover:bg-red-500 hover:text-white transition-colors rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              {editingCoupon && (
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSaveCoupon({
                      ...editingCoupon as Coupon,
                      id: editingCoupon.id || Math.random().toString(36).substr(2, 9),
                    });
                    setEditingCoupon(null);
                  }}
                  className="sticky top-0 bg-brand-cream p-8 rounded-2xl space-y-6 border border-black/5"
                >
                  <h3 className="font-serif text-2xl">{editingCoupon.id ? 'Edit Coupon' : 'New Coupon'}</h3>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Coupon Code</label>
                    <input 
                      value={editingCoupon.code || ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})}
                      className="w-full p-4 rounded-xl border border-black/5 font-mono uppercase tracking-widest" 
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Type</label>
                      <select 
                        value={editingCoupon.discountType} 
                        onChange={e => setEditingCoupon({...editingCoupon, discountType: e.target.value as 'fixed' | 'percentage'})}
                        className="w-full p-4 rounded-xl border border-black/5"
                      >
                        <option value="fixed">Fixed Amount (৳)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Value</label>
                      <input 
                        type="number"
                        value={editingCoupon.discountValue || 0} 
                        onChange={e => setEditingCoupon({...editingCoupon, discountValue: parseInt(e.target.value)})}
                        className="w-full p-4 rounded-xl border border-black/5" 
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Applies To</label>
                    <select 
                      value={editingCoupon.appliesTo} 
                      onChange={e => setEditingCoupon({...editingCoupon, appliesTo: e.target.value as any})}
                      className="w-full p-4 rounded-xl border border-black/5 mb-4"
                    >
                      <option value="all">All Products</option>
                      <option value="category">Specific Category</option>
                      <option value="product">Specific Product</option>
                    </select>

                    {editingCoupon.appliesTo === 'category' && (
                      <select 
                        value={editingCoupon.targetId || ''} 
                        onChange={e => setEditingCoupon({...editingCoupon, targetId: e.target.value})}
                        className="w-full p-4 rounded-xl border border-black/5"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}

                    {editingCoupon.appliesTo === 'product' && (
                      <div className="space-y-4">
                        <input 
                          type="text"
                          placeholder="Search for a product..."
                          value={couponProductSearch}
                          onChange={(e) => setCouponProductSearch(e.target.value)}
                          className="w-full p-4 rounded-xl border border-black/5 text-sm"
                        />
                        <select 
                          value={editingCoupon.targetId || ''} 
                          onChange={e => setEditingCoupon({...editingCoupon, targetId: e.target.value})}
                          className="w-full p-4 rounded-xl border border-black/5"
                          required
                        >
                          <option value="">Select Product</option>
                          {filteredProductsForCoupon.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <p className="text-[10px] text-muted-foreground italic">Search by name or unique ID</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]">Save Coupon</button>
                    <button type="button" onClick={() => setEditingCoupon(null)} className="flex-1 border border-black/10 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</button>
                  </div>
                </motion.form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isCheckoutStage, setIsCheckoutStage] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    address: '',
    shippingAddress: '',
    phone: '',
    email: ''
  });
  const [couponError, setCouponError] = useState<string | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(['Dresses', 'Tie-Dye / Block Print', 'Bags', 'Home Decor', 'Accessories', 'Custom Made']);
  const [galleryImagesData, setGalleryImagesData] = useState<{id: string, url: string}[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>(INITIAL_GALLERY);
  const [bannerText, setBannerText] = useState('Special Welcome Offer: 5% Discount for All First-Time Customers | Use code FAST26 at checkout!');
  const [bannerSpeed, setBannerSpeed] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(isUserAdmin(user));
      if (user && !isUserAdmin(user)) {
        // If logged in but not admin, maybe logout or just prevent admin panel
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      if (data.length > 0) setProducts(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data().name as string);
      if (data.length > 0) setCategories(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));

    const unsubGallery = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, url: doc.data().url as string }));
      setGalleryImagesData(data);
      if (data.length > 0) setGalleryImages(data.map(d => d.url));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'gallery'));

    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Coupon));
      setCoupons(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'coupons'));

    const unsubConfig = onSnapshot(doc(db, 'config', 'general'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.bannerText !== undefined) setBannerText(data.bannerText);
        if (data.bannerSpeed !== undefined) setBannerSpeed(data.bannerSpeed);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/general'));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubGallery();
      unsubCoupons();
      unsubConfig();
    };
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isUserAdmin(result.user)) {
        alert(`Access Denied: ${result.user.email} does not have admin privileges.`);
        await signOut(auth);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsAdminOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsCouponApplied(false);
    setDiscountAmount(0);
    setCouponCode('');
    if (!isCartOpen) {
      setIsCheckoutStage(false);
    }
  }, [isCartOpen, cartItems]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const displayCategories = ['All', ...categories];

  const addToCart = (product: Product) => {
    if (product.price === 'Inquiry') {
      const message = `Halo Art Kathara! I saw this product: "${product.name}". Price: ${product.price}. Is it available?`;
      window.open(`https://m.me/1027568157116678`, '_blank');
    } else {
      setCartItems(prev => [...prev, product]);
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
    // Reset coupon if cart becomes empty or no bags left
  };

  const hasBagsInCart = cartItems.some(item => item.category === 'Bags');

  const applyCoupon = () => {
    setCouponError(null);
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    
    if (!coupon) {
      setCouponError('This coupon is not valid.');
      return;
    }

    let isApplicable = false;
    let applicableTotal = 0;

    if (coupon.appliesTo === 'all') {
      isApplicable = cartItems.length > 0;
      applicableTotal = cartSubtotal;
    } else if (coupon.appliesTo === 'category') {
      const items = cartItems.filter(item => item.category === coupon.targetId);
      isApplicable = items.length > 0;
      applicableTotal = items.reduce((acc, item) => {
        const price = parseInt(item.price.replace('৳', '').replace(',', '').replace(' ', '')) || 0;
        return acc + price;
      }, 0);
    } else if (coupon.appliesTo === 'product') {
      const items = cartItems.filter(item => item.id === coupon.targetId);
      isApplicable = items.length > 0;
      applicableTotal = items.reduce((acc, item) => {
        const price = parseInt(item.price.replace('৳', '').replace(',', '').replace(' ', '')) || 0;
        return acc + price;
      }, 0);
    }

    if (isApplicable) {
      setIsCouponApplied(true);
      setCouponError(null);
      if (coupon.discountType === 'fixed') {
        setDiscountAmount(Math.min(coupon.discountValue, applicableTotal));
      } else {
        setDiscountAmount(Math.round(applicableTotal * (coupon.discountValue / 100)));
      }
    } else {
      setCouponError('This coupon is not applicable to any items in your bag.');
    }
  };

  const onSaveCoupon = async (coupon: Coupon) => {
    const path = `coupons/${coupon.id}`;
    try {
      await setDoc(doc(db, 'coupons', coupon.id), coupon);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const onDeleteCoupon = async (id: string) => {
    const path = `coupons/${id}`;
    try {
      await deleteDoc(doc(db, 'coupons', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const onSaveProduct = async (product: Product) => {
    const path = `products/${product.id}`;
    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const onDeleteProduct = async (id: string) => {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const onSaveCategory = async (old: string, updated: string) => {
    const id = updated.toLowerCase().replace(/\s+/g, '-');
    const path = `categories/${id}`;
    try {
      await setDoc(doc(db, 'categories', id), { name: updated });
      if (old && old !== updated) {
        await deleteDoc(doc(db, 'categories', old.toLowerCase().replace(/\s+/g, '-')));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const onDeleteCategory = async (cat: string) => {
    const id = cat.toLowerCase().replace(/\s+/g, '-');
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const onSaveGallery = async (url: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const path = `gallery/${id}`;
    try {
      await setDoc(doc(db, 'gallery', id), { url, createdAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const onDeleteGalleryImage = async (id: string) => {
    const path = `gallery/${id}`;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const onSaveBanner = async (text: string) => {
    const path = 'config/general';
    try {
      await setDoc(doc(db, 'config', 'general'), { bannerText: text }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const onSaveBannerSpeed = async (speed: number) => {
    const path = 'config/general';
    try {
      await setDoc(doc(db, 'config', 'general'), { bannerSpeed: speed }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const cartSubtotal = cartItems.reduce((acc, item) => {
    if (item.price === 'Inquiry') return acc;
    const price = parseInt(item.price.replace('৳', '').replace(',', '').replace(' ', '')) || 0;
    return acc + price;
  }, 0);

  const cartTotal = Math.max(0, cartSubtotal - (isCouponApplied ? discountAmount : 0));

  return (
    <div className="min-h-screen">
      {/* Top Discount Banner */}
      <ScrollingBanner html={bannerText} speed={bannerSpeed} />

      {/* Navbar */}
      <nav className={`fixed left-0 right-0 z-50 transition-all duration-300 px-6 py-4 lg:px-12 ${isScrolled ? 'top-0 bg-white/80 backdrop-blur-md border-b border-black/5' : (bannerText && bannerText.trim() !== '' ? 'top-10' : 'top-0')} bg-transparent`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-widest font-medium">
            {NAV_ITEMS.slice(0, 2).map((item) => (
              <a key={item.label} href={item.href} className="hover:opacity-60 transition-opacity">
                {item.label}
              </a>
            ))}
          </div>

          <a href="#" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            <img 
              src="https://images.pexels.com/photos/37587201/pexels-photo-37587201.jpeg" 
              alt="Kathara Logo" 
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </a>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-widest font-medium mr-6">
              {NAV_ITEMS.slice(2).map((item) => (
                <a key={item.label} href={item.href} className="hover:opacity-60 transition-opacity">
                  {item.label}
                </a>
              ))}
            </div>
            <button 
              onClick={() => {
                if (!currentUser) login();
                else if (isAdmin) setIsAdminOpen(true);
                else alert("Admin access only.");
              }}
              className={`hover:opacity-60 transition-opacity p-2 ${currentUser && isAdmin ? 'bg-brand-beige/30' : 'bg-black/5'} rounded-full`}
              title={currentUser ? (isAdmin ? "Admin Panel" : "Access Denied") : "Login as Admin"}
            >
              {currentUser && isAdmin ? <Settings size={18} strokeWidth={1.5} /> : <UserIcon size={18} strokeWidth={1.5} />}
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hover:opacity-60 transition-opacity"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button 
              className="relative hover:opacity-60 transition-opacity"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </button>
            <button className="lg:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]"
            />
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-0 left-0 w-full bg-white z-[160] p-8 md:p-12 shadow-2xl"
            >
              <div className="max-w-4xl mx-auto flex items-center gap-6">
                <Search size={24} className="text-muted-foreground" />
                <input 
                  autoFocus
                  placeholder="Search for products, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-2xl md:text-4xl font-serif outline-none border-b border-black/10 focus:border-black transition-colors"
                />
                <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={32} strokeWidth={1} />
                </button>
              </div>
              
              {searchQuery && (
                <div className="max-w-4xl mx-auto mt-8 max-h-[60vh] overflow-y-auto pr-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-8">
                    {filteredProducts.length} Results for "{searchQuery}"
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredProducts.map((p) => (
                      <div 
                        key={p.id} 
                        className="group cursor-pointer"
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="aspect-[3/4] bg-brand-beige overflow-hidden mb-2">
                          <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h4 className="font-serif text-sm line-clamp-1">{p.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{p.price}</p>
                      </div>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground italic font-light">No products found matching your search.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[120] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between">
                <h2 className="font-serif text-2xl">Your Bag ({cartItems.length})</h2>
                <button onClick={() => setIsCartOpen(false)}><X size={24} strokeWidth={1} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <ShoppingBag size={40} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-muted-foreground italic">Your bag is currently empty.</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 text-xs uppercase tracking-widest font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : isCheckoutStage ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <button 
                      onClick={() => setIsCheckoutStage(false)}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={14} /> Back to Bag
                    </button>
                    
                    <div className="space-y-6 text-black">
                      <h3 className="font-serif text-2xl">Delivery Details</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Full Name</label>
                          <input 
                            type="text"
                            value={checkoutData.name}
                            onChange={(e) => setCheckoutData({...checkoutData, name: e.target.value})}
                            className="w-full bg-brand-beige/20 border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Phone Number</label>
                          <input 
                            type="tel"
                            value={checkoutData.phone}
                            onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})}
                            className="w-full bg-brand-beige/20 border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 rounded-xl"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Billing Address</label>
                          <textarea 
                            value={checkoutData.address}
                            onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})}
                            className="w-full bg-brand-beige/20 border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 rounded-xl h-24"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Shipping Address</label>
                          <textarea 
                            value={checkoutData.shippingAddress}
                            onChange={(e) => setCheckoutData({...checkoutData, shippingAddress: e.target.value})}
                            className="w-full bg-brand-beige/20 border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 rounded-xl h-24"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold block mb-2 opacity-70">Email (Optional)</label>
                          <input 
                            type="email"
                            value={checkoutData.email}
                            onChange={(e) => setCheckoutData({...checkoutData, email: e.target.value})}
                            className="w-full bg-brand-beige/20 border border-black/5 px-4 py-3 text-sm focus:outline-none focus:border-black/20 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {cartItems.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="flex gap-4">
                        <div className="w-20 aspect-[3/4] bg-brand-beige overflow-hidden">
                          <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-serif text-lg">{item.name}</h4>
                            <button onClick={() => removeFromCart(index)} className="text-muted-foreground hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{item.category}</p>
                          <p className="text-sm font-medium">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-8 border-t border-black/5 space-y-6 text-black">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Apply Coupon</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter code" 
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyCoupon();
                          }
                        }}
                        disabled={isCouponApplied}
                        className="flex-1 bg-brand-beige/20 border border-black/5 px-4 py-3 text-xs focus:outline-none focus:border-black/20 rounded-xl"
                      />
                      <button 
                        onClick={applyCoupon}
                        disabled={isCouponApplied}
                        className={`px-6 py-3 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all ${isCouponApplied ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-black/80'}`}
                      >
                        {isCouponApplied ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                    {isCouponApplied && (
                      <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Tag size={10} /> Discount applied successfully!
                      </p>
                    )}
                    {couponError && (
                      <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">
                        {couponError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span className="text-[10px] uppercase tracking-widest font-bold">Subtotal</span>
                      <span className="font-sans text-sm">৳{cartSubtotal.toLocaleString()}</span>
                    </div>
                    {isCouponApplied && (
                      <div className="flex justify-between items-center text-green-600 font-medium">
                        <span className="text-[10px] uppercase tracking-widest font-bold">Discount</span>
                        <span className="font-sans text-sm">-৳{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-black/5">
                      <span className="text-xs uppercase tracking-widest font-bold">Order Total</span>
                      <span className="font-serif text-2xl">৳{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {!isCheckoutStage ? (
                    <button 
                      className="w-full bg-black text-white py-5 rounded-full text-xs uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                      onClick={() => setIsCheckoutStage(true)}
                    >
                      Proceed to Checkout
                    </button>
                  ) : (
                      <div className="flex flex-col gap-3">
                        <button 
                          className="w-full bg-green-600 text-white py-5 rounded-full text-xs uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                          onClick={() => {
                            if (!checkoutData.name || !checkoutData.phone || !checkoutData.address || !checkoutData.shippingAddress) {
                              alert('Please fill in all required fields.');
                              return;
                            }

                            const itemsText = cartItems.map(item => `- ${item.name} (${item.price})`).join('\n');
                            const message = `*New Order from Kathara*\n\n` +
                              `*Customer Details:*\n` +
                              `Name: ${checkoutData.name}\n` +
                              `Phone: ${checkoutData.phone}\n` +
                              `Billing Address: ${checkoutData.address}\n` +
                              `Shipping Address: ${checkoutData.shippingAddress}\n` +
                              `${checkoutData.email ? `Email: ${checkoutData.email}\n` : ''}\n` +
                              `*Items:*\n${itemsText}\n\n` +
                              `*Subtotal:* ৳${cartSubtotal.toLocaleString()}\n` +
                              `${isCouponApplied ? `*Discount:* -৳${discountAmount.toLocaleString()}\n` : ''}` +
                              `*Total:* ৳${cartTotal.toLocaleString()}\n\n` +
                              `Please confirm my order. Thank you!`;

                            const encodedMessage = encodeURIComponent(message);
                            window.open(`https://wa.me/8801746692155?text=${encodedMessage}`, '_blank');
                            
                            setCartItems([]);
                            setIsCartOpen(false);
                            setIsCheckoutStage(false);
                          }}
                        >
                          <MessageCircle size={18} /> Place Order (WhatsApp)
                        </button>
                        <button 
                          className="w-full bg-blue-600 text-white py-5 rounded-full text-xs uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                          onClick={() => {
                            if (!checkoutData.name || !checkoutData.phone || !checkoutData.address || !checkoutData.shippingAddress) {
                              alert('Please fill in all required fields.');
                              return;
                            }
                            // For m.me we just open the chat
                            window.open(`https://m.me/1027568157116678`, '_blank');
                            alert('Messenger chat opened! Please send your order details there.');
                            setCartItems([]);
                            setIsCartOpen(false);
                            setIsCheckoutStage(false);
                          }}
                        >
                          Place Order (Messenger)
                        </button>
                      </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[60] bg-white flex flex-col p-12"
          >
            <button className="absolute top-8 right-8" onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
            <div className="flex flex-col gap-8 mt-12">
              {NAV_ITEMS.map((item) => (
                <a 
                  key={item.label} 
                  href={item.href} 
                  className="font-serif text-4xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header className="relative h-[85vh] md:h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/37589851/pexels-photo-37589851.png" 
            alt="Kathara Hero"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="relative z-10 text-center px-6">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-xs md:text-sm uppercase tracking-[0.5em] font-medium pl-0 ml-0 pb-0 mr-0 mb-[300px]"
          >
            Curated Artisanal Crafts
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <a 
              href="#products" 
              className="inline-flex items-center gap-4 bg-white text-black px-12 py-6 rounded-full text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 shadow-2xl"
            >
              Explore Collection <ArrowRight size={18} />
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="w-[1px] h-12 bg-white/50"></div>
        </motion.div>
      </header>

      {/* Categories Horizontal */}
      <section className="py-12 px-6 border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-4 no-scrollbar pb-2">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-medium transition-all ${
                selectedCategory === cat ? 'bg-black text-white' : 'bg-brand-beige/50 text-black hover:bg-brand-beige'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section id="products" className="py-24 px-6 bg-brand-cream">
        <div className="max-w-7xl mx-auto">
          <SectionTitle 
            title="Featured Collection" 
            subtitle="Our most-loved pieces, crafted by seasoned artisans using traditional techniques." 
          />
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onInquiry={addToCart} 
                onClick={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>

          <div className="text-center mt-20">
            <button className="border-b border-black pb-2 text-xs uppercase tracking-widest font-bold hover:opacity-50 transition-opacity">
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* Auto-scrolling Gallery */}
      <section className="py-24 bg-white overflow-hidden">
        <SectionTitle 
          title="Artisan Gallery" 
          subtitle="A glimpse into our workshop and the soulful process behind each creation." 
        />
        <InfiniteMarquee items={galleryImages} />
      </section>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailsModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onAction={addToCart}
            coupons={coupons}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel 
            products={products}
            categories={categories}
            galleryImages={galleryImagesData}
            bannerText={bannerText}
            bannerSpeed={bannerSpeed}
            coupons={coupons}
            onSaveCoupon={onSaveCoupon}
            onDeleteCoupon={onDeleteCoupon}
            onSaveProduct={onSaveProduct}
            onDeleteProduct={onDeleteProduct}
            onSaveCategory={onSaveCategory}
            onDeleteCategory={onDeleteCategory}
            onSaveGallery={onSaveGallery}
            onDeleteGalleryImage={onDeleteGalleryImage}
            onSaveBanner={onSaveBanner}
            onSaveBannerSpeed={onSaveBannerSpeed}
            onLogout={logout}
            onClose={() => setIsAdminOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Brand Story / About */}
      <section id="about" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] bg-brand-beige rounded-[40px] overflow-hidden rotate-2">
              <img 
                src="https://picsum.photos/seed/kathara-about/800/1000" 
                alt="Process" 
                className="w-full h-full object-cover -rotate-2 scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-beige rounded-full -z-10 opacity-50"></div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[11px] uppercase tracking-[0.3em] font-semibold text-muted-foreground mb-6">Our Legacy</p>
            <h2 className="font-serif text-5xl mb-8 tracking-tight leading-tight">The Art of Slow Fashion & Authentic Living.</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed font-light text-lg">
              <p>
                Kathara was born from a desire to reconnect with the soulful process of making. 
                We believe that every stitch, every dye bath, and every block print carries the energy of the maker.
              </p>
              <p>
                Our collections celebrate traditional craftsmanship, from the ancient art of block printing to the intricate patterns of tie-dye. 
                We work directly with artisans to create pieces that are not just products, but stories.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div>
                <h4 className="font-bold text-2xl mb-1">100%</h4>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Handmade</p>
              </div>
              <div>
                <h4 className="font-bold text-2xl mb-1">Eco-Friendly</h4>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Sustainably Sourced</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Custom Made CTA */}
      <section className="py-24 px-6 bg-brand-beige/30">
        <div className="max-w-4xl mx-auto text-center">
          <SectionTitle 
            title="Custom Made Philosophy" 
            subtitle="Have a vision of your own? We specialize in bringing custom-made dreams to life, tailored exactly to your silhouette and style." 
          />
          <a 
            href="https://m.me/1027568157116678"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white px-12 py-5 rounded-full text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform inline-flex items-center gap-3 mx-auto"
          >
            Message for Custom Consultation
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-6 bg-brand-cream border-t border-black/5">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-serif text-3xl mb-4">Join our Atelier</h3>
          <p className="text-muted-foreground mb-8 text-sm">Stay updated on new collections, artisan stories, and exclusive previews.</p>
          <form className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-white border border-black/10 px-6 py-4 text-sm focus:outline-none focus:border-black/30 transition-all"
            />
            <button className="bg-black text-white px-8 py-4 text-xs uppercase tracking-widest font-bold">Join</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div>
              <img 
                src="https://images.pexels.com/photos/37587201/pexels-photo-37587201.jpeg" 
                alt="Kathara Logo" 
                className="h-12 w-auto object-contain mb-6"
                referrerPolicy="no-referrer"
              />
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Premium handcrafted products for the conscious individual. Elegance in every stitch.
              </p>
              <div className="flex gap-4">
                <a href="https://instagram.com/art.kathara" target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-beige/30 rounded-full hover:bg-brand-beige transition-colors"><Instagram size={18} /></a>
                <a href="https://www.facebook.com/art.kathara" target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-beige/30 rounded-full hover:bg-brand-beige transition-colors"><Facebook size={18} /></a>
                <a href="https://m.me/1027568157116678" target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-beige/30 rounded-full hover:bg-brand-beige transition-colors"><MessageCircle size={18} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-6">Boutique</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-light">
                <li><a href="#" className="hover:text-black transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Dresses</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Home Decor</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Accessories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-6">Information</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-light">
                <li><a href="#" className="hover:text-black transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Care Instructions</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-light">
                <li className="flex items-center gap-3">
                  <MessageCircle size={16} strokeWidth={1.5} />
                  <a href="https://m.me/1027568157116678" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Messenger</a>
                </li>
                <li className="flex items-center gap-3"><Mail size={16} strokeWidth={1.5} /> hello@kathara.com</li>
                <li className="flex items-center gap-3">
                  <Phone size={16} strokeWidth={1.5} /> 
                  <a href="tel:+8809611409307" className="hover:text-black transition-colors">+880 96114 09307</a>
                </li>
                <li className="mt-4 opacity-70">Dhanmondi, Dhaka,<br />Bangladesh</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">© 2026 KATHARA. ALL RIGHTS RESERVED</p>
            <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold">
              <a href="#" className="hover:opacity-50 transition-opacity">Visa</a>
              <a href="#" className="hover:opacity-50 transition-opacity">Mastercard</a>
              <a href="#" className="hover:opacity-50 transition-opacity">Bkash</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
