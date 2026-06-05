export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  account_status: 'active' | 'frozen' | 'banned';
  email_verified: boolean;
  created_at: Date;
}

export interface VerifiedUser {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'customer';
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: 'in_stock' | 'out_of_stock' | 'coming_soon' | 'pre_order';
  stock_quantity: number;
  created_at: Date;
  updated_at: Date;
}

// Order Types
export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'declined' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  created_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
}

// Inspiration Types
export interface InspirationImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  like_count: number;
  display_order: number;
  created_at: Date;
  is_active: boolean;
}

export interface InspirationImageWithLike extends InspirationImage {
  user_liked: boolean;
}

// FAQ Types
export interface FAQ {
  id: string;
  question: string;
  answer: string | null;
  asked_by_email: string | null;
  asked_by_name: string | null;
  is_published: boolean;
  is_answered: boolean;
  created_at: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
