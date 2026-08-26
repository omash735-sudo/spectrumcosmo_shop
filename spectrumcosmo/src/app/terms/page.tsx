import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

export default async function TermsPage() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'terms'`;
  const content = row?.content || {};

  const title = content.title || 'Terms & Conditions';
  const lastUpdated = content.last_updated || '2026-05-09';
  const htmlContent = content.content || `
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using SpectrumCosmo ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use our website or services. These terms apply to all users in Malawi and across Africa.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 18 years old to place an order. If you are under 18, you may use the website only with the involvement of a parent or guardian.</p>

    <h2>3. Beta Service Disclaimer</h2>
    <p>SpectrumCosmo is currently in beta testing. The service is provided "as is" and "as available" without warranties of any kind. We do not guarantee that the website will be uninterrupted, error‑free, or secure. Features may change, be temporarily unavailable, or be removed without notice. You acknowledge that beta software may contain bugs or performance issues.</p>

    <h2>4. Orders and Payments</h2>
    <p>All orders are subject to product availability. Prices are displayed in Malawian Kwacha (MWK) unless stated otherwise. We reserve the right to change prices or discontinue products at any time without notice.</p>
    <p>Payment must be made in full before processing your order. We accept payments via:</p>
    <ul><li>Airtel Money</li><li>Mpamba (TN Money)</li><li>Bank transfers (Malawian banks only)</li></ul>
    <p>By submitting a payment, you confirm that you are authorised to use the chosen payment method. If a payment fails, your order will not be processed. We are not responsible for errors made by third‑party payment providers.</p>

    <h2>5. Delivery and Shipping</h2>
    <p>Delivery is available within Lilongwe and Blantyre, as well as other Malawian locations as indicated at checkout. Delivery times are estimates and not guaranteed. Risk of loss or damage to products passes to you upon delivery. You are responsible for providing a correct and accessible delivery address. Failed deliveries due to incorrect information may incur additional fees.</p>

    <h2>6. Returns, Refunds, and Cancellations</h2>
    <p>You may cancel an order within 2 hours of placing it, provided it has not yet been processed for delivery. To cancel, email <a href="mailto:spectrumcosmo01@gmail.com">spectrumcosmo01@gmail.com</a> with your order number.</p>
    <p>Returns are accepted within 7 days of delivery if the product is unused, in original packaging, and not a perishable or hygiene item. Customers are responsible for return shipping costs unless the product is defective or incorrect. Refunds will be issued to the original payment method within 14 days of receiving the returned product. Defective products will be replaced or refunded in full including shipping.</p>

    <h2>7. User Responsibilities and Prohibited Conduct</h2>
    <p>You agree not to:</p>
    <ul><li>Use the platform for any illegal purpose under Malawian law, including the Electronic Transactions and Cyber Security Act</li><li>Attempt to gain unauthorised access to our systems or other users' accounts</li><li>Provide false, inaccurate, or misleading information</li><li>Interfere with the proper functioning of the website (e.g., viruses, scraping, denial‑of‑service attacks)</li><li>Resell our products without written permission</li></ul>
    <p>Violation may result in immediate termination of your access and legal action.</p
