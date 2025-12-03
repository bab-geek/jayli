
import { Cake, CakeCategory, Review, BuilderOption } from './types';

export const WHATSAPP_NUMBER = "254706816485";

// --- Custom Builder Options ---
export const CAKE_FLAVORS: BuilderOption[] = [
  { id: 'vanilla', name: 'Classic Vanilla', priceModifier: 0, description: 'Light, fluffy, and timeless.' },
  { id: 'chocolate', name: 'Rich Chocolate', priceModifier: 200, description: 'Decadent dark cocoa sponge.' },
  { id: 'redvelvet', name: 'Red Velvet', priceModifier: 300, description: 'Mild cocoa with a buttermilk tang.' },
  { id: 'fruit', name: 'Kenyan Fruit Cake', priceModifier: 500, description: 'Traditional spiced fruit cake.' },
  { id: 'blueberry', name: 'Blueberry Burst', priceModifier: 400, description: 'Infused with real blueberries.' }
];

export const CAKE_FILLINGS: BuilderOption[] = [
  { id: 'buttercream', name: 'Vanilla Buttercream', priceModifier: 0 },
  { id: 'choc_ganache', name: 'Dark Chocolate Ganache', priceModifier: 300 },
  { id: 'creamcheese', name: 'Cream Cheese', priceModifier: 400 },
  { id: 'freshcream', name: 'Fresh Whipped Cream', priceModifier: 200 },
  { id: 'lemon', name: 'Lemon Curd', priceModifier: 250 }
];

export const CAKE_FROSTINGS: BuilderOption[] = [
  { id: 'semi_naked', name: 'Semi-Naked (Rustic)', priceModifier: 0 },
  { id: 'smooth', name: 'Smooth Buttercream', priceModifier: 200 },
  { id: 'fondant', name: 'Fondant Finish', priceModifier: 800 },
  { id: 'rosette', name: 'Rosette Texture', priceModifier: 400 }
];

export const BASE_PRICE_PER_KG = 2000;

// --- Existing Data ---

export const INITIAL_CAKES: Cake[] = [
  {
    id: '1',
    name: 'Classic Black Forest',
    description: 'Layers of rich chocolate sponge, whipped cream, and cherries. A Kenyan favorite.',
    price: 2500,
    category: CakeCategory.BIRTHDAY,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop',
    rating: 4.8
  },
  {
    id: '2',
    name: 'Elegant Gold Drip Graduation',
    description: 'Vanilla sponge with buttercream frosting and a gold drip finish. Includes custom topper.',
    price: 4500,
    category: CakeCategory.GRADUATION,
    imageUrl: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?q=80&w=800&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: '3',
    name: 'Scholars Chocolate Delight',
    description: 'A rich chocolate fudge cake with gold accents, perfect for celebrating academic success.',
    price: 5500,
    category: CakeCategory.GRADUATION,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop',
    rating: 5.0
  },
  {
    id: '4',
    name: '3-Tier Floral Wedding Cake',
    description: 'Elegant white fondant with handcrafted sugar flowers. Flavors: Red Velvet, Vanilla, and Fruit Cake.',
    price: 14500,
    category: CakeCategory.WEDDING,
    imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=800&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: '5',
    name: 'Rustic Semi-Naked Wedding Cake',
    description: 'Lightly frosted with fresh flowers and berries. Lemon and Blueberry flavor.',
    price: 11000,
    category: CakeCategory.WEDDING,
    imageUrl: 'https://images.unsplash.com/photo-1519340333755-56e9c1d04579?q=80&w=800&auto=format&fit=crop',
    rating: 4.7
  },
  {
    id: 'w3',
    name: 'Royal Gold & White Tier',
    description: 'A majestic 4-tier cake with edible gold leaf and white roses. Perfect for grand weddings.',
    price: 15000,
    category: CakeCategory.WEDDING,
    imageUrl: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?q=80&w=800&auto=format&fit=crop',
    rating: 5.0
  },
  {
    id: 'w4',
    name: 'Classic Kenyan Fruit Cake',
    description: 'Traditional rich fruit cake, matured with brandy and covered in hard icing.',
    price: 13500,
    category: CakeCategory.WEDDING,
    imageUrl: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=800&auto=format&fit=crop',
    rating: 4.8
  },
  {
    id: 'w5',
    name: 'Modern Minimalist',
    description: 'Smooth buttercream finish with a single statement flower. Simple and chic.',
    price: 9500,
    category: CakeCategory.WEDDING,
    imageUrl: 'https://images.unsplash.com/photo-1560180474-e8563fd75bab?q=80&w=800&auto=format&fit=crop',
    rating: 4.6
  },
  {
    id: '6',
    name: 'Colorful Funfetti Surprise',
    description: 'Bright and colorful cake with sprinkles inside and out. Perfect for kids parties!',
    price: 3500,
    category: CakeCategory.KIDS,
    imageUrl: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=800&auto=format&fit=crop',
    rating: 4.8
  },
  {
    id: '7',
    name: 'Unicorn Fantasy',
    description: 'Pastel colors, whimsical decorations, and sweet strawberry swirl flavor.',
    price: 3200,
    category: CakeCategory.KIDS,
    imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?q=80&w=800&auto=format&fit=crop',
    rating: 4.9
  },
  {
    id: '8',
    name: 'Red Velvet Supreme',
    description: 'Rich red velvet sponge with smooth cream cheese frosting.',
    price: 2800,
    category: CakeCategory.GENERAL,
    imageUrl: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=800&auto=format&fit=crop',
    rating: 4.6
  },
  {
    id: '9',
    name: 'Blueberry Lemon Zest',
    description: 'Fresh lemon sponge with blueberry compote filling. Light and refreshing.',
    price: 3000,
    category: CakeCategory.GENERAL,
    imageUrl: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?q=80&w=800&auto=format&fit=crop',
    rating: 4.7
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    customerName: 'Wanjiku M.',
    rating: 5,
    comment: 'The graduation cake was the highlight of our party! Taste was amazing.',
    date: '2023-11-15'
  },
  {
    id: 'r2',
    customerName: 'Otieno J.',
    rating: 4,
    comment: 'Great delivery speed within Mbita. The Black Forest is authentic.',
    date: '2023-12-02'
  },
  {
    id: 'r3',
    customerName: 'Sarah K.',
    rating: 5,
    comment: 'Ordered a wedding cake last minute and they delivered perfection. Asante sana!',
    date: '2024-01-10'
  }
];
