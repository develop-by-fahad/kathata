import { Product, NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Products', href: '#products' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Artisanal Block Print Dress',
    price: '৳8,500',
    oldPrice: '৳10,000',
    category: 'Dresses',
    description: 'Hand-blocked cotton dress with intricate floral patterns.',
    images: [
      'https://picsum.photos/seed/kathara1/600/800',
      'https://picsum.photos/seed/kathara-alt1/600/800',
      'https://picsum.photos/seed/kathara-alt1b/600/800'
    ],
    featured: true,
  },
  {
    id: '2',
    name: 'Indigo Tie-Dye Kaftan',
    price: '৳6,500',
    oldPrice: '৳7,500',
    category: 'Tie-Dye / Block Print',
    description: 'Breathable linen kaftan with traditional shibori indigo dye.',
    images: [
      'https://picsum.photos/seed/kathara2/600/800',
      'https://picsum.photos/seed/kathara-alt2/600/800'
    ],
    newCollection: true,
  },
  {
    id: '3',
    name: 'Handwoven Jute Tote',
    price: '৳4,500',
    category: 'Bags',
    description: 'Eco-friendly and durable tote bag with leather accents.',
    images: [
      'https://picsum.photos/seed/kathara3/600/800',
      'https://picsum.photos/seed/kathara-alt3/600/800',
      'https://picsum.photos/seed/kathara-alt3b/600/800'
    ],
    featured: true,
  },
  {
    id: '4',
    name: 'Ceramic Hand-painted Vase',
    price: '৳4,000',
    category: 'Home Decor',
    description: 'Unique hand-painted ceramic vase for your minimalist home.',
    images: [
      'https://picsum.photos/seed/kathara4/600/800',
      'https://picsum.photos/seed/kathara-alt4/600/800'
    ],
  },
  {
    id: '5',
    name: 'Silk Embroidered Scarf',
    price: '৳3,000',
    category: 'Accessories',
    description: 'Fine silk scarf with delicate hand embroidery.',
    images: [
      'https://picsum.photos/seed/kathara5/600/800',
      'https://picsum.photos/seed/kathara-alt5/600/800'
    ],
    newCollection: true,
  },
  {
    id: '6',
    name: 'Custom Made Tailored Suit',
    price: 'Inquiry',
    category: 'Custom Made',
    description: 'Besom tailored linen suit made exactly to your measurements.',
    images: [
      'https://picsum.photos/seed/kathara6/600/800',
      'https://picsum.photos/seed/kathara-alt6/600/800'
    ],
    featured: true,
  },
];

export const GALLERY_IMAGES = [
  'https://picsum.photos/seed/gallery1/800/1000',
  'https://picsum.photos/seed/gallery2/800/1000',
  'https://picsum.photos/seed/gallery3/800/1000',
  'https://picsum.photos/seed/gallery4/800/1000',
  'https://picsum.photos/seed/gallery5/800/1000',
  'https://picsum.photos/seed/gallery6/800/1000',
];

export const COLORS = {
  bg: '#FDFCF8', // Creamy off-white
  surface: '#FFFFFF',
  accent: '#E5DED4', // Soft beige/pastel
  text: '#1C1C1C', // Soft black
  textMuted: '#6B6B6B',
};
