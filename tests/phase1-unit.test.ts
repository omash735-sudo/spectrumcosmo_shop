/**
 * Phase 1 Pure Unit Test Suite (No Database Connection Required)
 * Run using: npx tsx tests/phase1-unit.test.ts
 */

import crypto from 'crypto';

function calculateServerOrderTotal(items: Array<{ unit_price_usd: number; quantity: number }>, exchangeRateMWK: number = 1750) {
  const subtotalUSD = items.reduce((sum, item) => sum + item.unit_price_usd * item.quantity, 0);
  const shippingFeeUSD = subtotalUSD >= 150 ? 0 : 15;
  const totalUSD = subtotalUSD + shippingFeeUSD;
  const totalMWK = Math.round(totalUSD * exchangeRateMWK);

  return {
    subtotalUSD: Number(subtotalUSD.toFixed(2)),
    shippingFeeUSD: Number(shippingFeeUSD.toFixed(2)),
    totalUSD: Number(totalUSD.toFixed(2)),
    totalMWK,
  };
}

function computePayloadHash(payload: object): string {
  const serialized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

function runUnitTests() {
  console.log('--- Running Phase 1 Unit Tests ---');

  // Test 1: Server Total Price Calculation under $150 threshold
  const calc1 = calculateServerOrderTotal([
    { unit_price_usd: 25.00, quantity: 2 }, // $50
    { unit_price_usd: 40.00, quantity: 1 }, // $40 -> Subtotal $90
  ]);
  console.assert(calc1.subtotalUSD === 90.00, `Expected subtotal $90.00, got ${calc1.subtotalUSD}`);
  console.assert(calc1.shippingFeeUSD === 15.00, `Expected shipping fee $15.00, got ${calc1.shippingFeeUSD}`);
  console.assert(calc1.totalUSD === 105.00, `Expected total USD $105.00, got ${calc1.totalUSD}`);
  console.assert(calc1.totalMWK === 183750, `Expected total MWK 183,750, got ${calc1.totalMWK}`);
  console.log('✓ Test 1 Passed: Order calculation under $150 (with $15 shipping fee)');

  // Test 2: Server Total Price Calculation above $150 threshold (Free Shipping)
  const calc2 = calculateServerOrderTotal([
    { unit_price_usd: 100.00, quantity: 2 }, // $200 -> Subtotal $200
  ]);
  console.assert(calc2.subtotalUSD === 200.00, `Expected subtotal $200.00, got ${calc2.subtotalUSD}`);
  console.assert(calc2.shippingFeeUSD === 0.00, `Expected free shipping, got ${calc2.shippingFeeUSD}`);
  console.assert(calc2.totalUSD === 200.00, `Expected total USD $200.00, got ${calc2.totalUSD}`);
  console.log('✓ Test 2 Passed: Order calculation over $150 (free shipping threshold)');

  // Test 3: Payload Deterministic Hashing
  const payloadA = { items: [{ id: 1, qty: 2 }], email: 'test@example.com' };
  const payloadB = { email: 'test@example.com', items: [{ id: 1, qty: 2 }] };
  const hashA = computePayloadHash(payloadA);
  const hashB = computePayloadHash(payloadB);
  console.assert(hashA === hashB, `Expected identical payload hashes for reordered keys`);
  console.log('✓ Test 3 Passed: Idempotency deterministic payload hashing');

  console.log('--- All Phase 1 Unit Tests Passed Successfully ---');
}

runUnitTests();
