export interface PayChanguRequest {
  amount: number
  currency: "MWK" | "USD"
  email: string
  first_name: string
  last_name: string
  tx_ref: string
  callback_url: string
  return_url: string
  customization: {
    title: string
    description: string
  }
  meta: {
    order_id: string
    [key: string]: string
  }
}

export interface PayChanguResponse {
  status: string
  message: string
  data: {
    checkout_url: string
    tx_ref: string
  }
}

export interface PayChanguVerifyResponse {
  status: string
  data: {
    status: "success" | "failed" | "pending"
    amount: number
    currency: string
    charge_id: string
    tx_ref: string
  }
}

export interface WebhookPayload {
  status: "success" | "failed" | "pending"
  amount: number
  charge_id: string
  reference: string
  meta?: {
    order_id?: string
    [key: string]: string | undefined
  }
}
