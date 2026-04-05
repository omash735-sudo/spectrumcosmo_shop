export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  phone_number: string
  product_name: string
  custom_details: string
  status: 'pending' | 'processing' | 'completed'
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
