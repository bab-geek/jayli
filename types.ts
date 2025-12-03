
export enum CakeCategory {
  GRADUATION = 'Graduation',
  WEDDING = 'Wedding',
  KIDS = 'Kids Corner',
  BIRTHDAY = 'Birthday',
  GENERAL = 'General'
}

export interface Cake {
  id: string;
  name: string;
  description: string;
  price: number; // In KES
  category: CakeCategory;
  imageUrl: string;
  rating: number;
}

export interface CartItem extends Cake {
  quantity: number;
  weight: number; // in Kg
  customMessage?: string;
  isCustom?: boolean;
  configuration?: CustomCakeConfig;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'Baking' | 'Out for Delivery' | 'Delivered';
  customerName: string;
  date: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- Builder Types ---

export interface BuilderOption {
  id: string;
  name: string;
  priceModifier: number; // Price per KG addition
  description?: string;
}

export interface CustomCakeConfig {
  flavor: BuilderOption;
  filling: BuilderOption;
  frosting: BuilderOption;
  toppers: string[]; // e.g. "Gold Drip", "Flowers"
  weight: number;
  message: string;
}
