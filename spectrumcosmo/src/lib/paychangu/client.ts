import type {
  PayChanguRequest,
  PayChanguResponse,
  PayChanguVerifyResponse,
} from "./types"

const BASE_URL = "https://api.paychangu.com"
const SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY!

if (!SECRET_KEY) {
  throw new Error("PAYCHANGU_SECRET_KEY is missing in environment variables")
}

/**
 * 🔵 Create a payment session (redirect user to checkout)
 */
export async function createPayment(
  payload: PayChanguRequest
): Promise<PayChanguResponse> {
  const res = await fetch(`${BASE_URL}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error("PayChangu createPayment error:", data)
    throw new Error(data?.message || "Failed to create payment session")
  }

  return data
}

/**
 * 🟢 Verify a payment using tx_ref
 */
export async function verifyPayment(
  tx_ref: string
): Promise<PayChanguVerifyResponse> {
  if (!tx_ref) {
    throw new Error("tx_ref is required for verification")
  }

  const res = await fetch(
    `${BASE_URL}/verify-payment/${tx_ref}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        Accept: "application/json",
      },
    }
  )

  const data = await res.json()

  if (!res.ok) {
    console.error("PayChangu verifyPayment error:", data)
    throw new Error(data?.message || "Failed to verify payment")
  }

  return data
}
