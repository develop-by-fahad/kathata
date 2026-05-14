export type Category = 'Dresses' | 'Custom Made' | 'Tie-Dye / Block Print' | 'Home Decor' | 'Bags' | 'Accessories';

export interface Product {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  category: string; // Changed from Category to string for dynamic category management
  description: string;
  images: string[]; // Changed from image: string
  featured?: boolean;
  newCollection?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  appliesTo: 'all' | 'category' | 'product';
  targetId?: string; // category name or product ID
}
