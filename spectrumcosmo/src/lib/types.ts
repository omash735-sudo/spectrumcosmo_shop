export interface AdminPayload {
  id: string
  username: string
  role: 'admin'
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  status: 'in_stock' | 'sold' | 'coming_soon'
  currency: string
  created_at: string
}

export interface Order {
  id: string
  user_id?: string
  customer_name: string
  phone_number: string
  email?: string
  product_name: string
  custom_details: string
  status: 'pending' | 'processing' | 'completed'
  delivery_method?: string
  payment_method?: string
  total_amount?: number
  created_at: string
}

export interface Review {
  id: string
  customer_name: string
  review_text: string
  rating: number
  image_url: string
  product_id: string | null
  approved: boolean
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface UserPayload {
  id: string
  name: string
  email: string
  role: 'customer'
}

export interface PaymentOption {
  id: string
  type: 'mobile_wallet' | 'bank'
  name: string
  logo_url?: string
  details?: string
  is_active: boolean
  sort_order: number
}

export interface DeliveryMethod {
  id: string
  name: string
  logo_url?: string
  price: number
  is_active: boolean
}

export interface SiteContent {
  id: string
  key: string
  value: string
  updated_at: string
}
