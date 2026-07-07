// app/terms/page.tsx
export const dynamic = 'force-dynamic';
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
    <p>Violation may result in immediate termination of your access and legal action.</p>

    <h2>8. Account Suspension and Termination</h2>
    <p>We reserve the right to suspend or terminate your access to SpectrumCosmo at any time, without notice, for conduct that violates these Terms or harms our business or other users. You may delete your account by contacting us.</p>

    <h2>9. Limitation of Liability</h2>
    <p>To the maximum extent permitted by Malawian law, SpectrumCosmo and its owners shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the website, including lost profits, data loss, or interruption of service. Our total liability for any claim arising from these Terms or your use of the service shall not exceed the amount you paid for the product giving rise to the claim. This limitation does not apply to claims for death, personal injury, fraud, or wilful misconduct. Nothing in these Terms excludes or limits our liability where it would be unlawful to do so.</p>

    <h2>10. Warranty Disclaimer</h2>
    <p>Except as expressly stated in these Terms, the products and website are provided "as is" without warranties of merchantability, fitness for a particular purpose, or non‑infringement. We do not warrant that the website will be secure, uninterrupted, or error‑free. Some jurisdictions do not allow disclaimer of implied warranties, so this may not apply to you.</p>

    <h2>11. Force Majeure</h2>
    <p>We are not liable for delays or failures to perform due to causes beyond our reasonable control, including natural disasters, war, strikes, internet outages, government actions, or provider failures.</p>

    <h2>12. Governing Law and Dispute Resolution</h2>
    <p>These Terms are governed by the laws of the Republic of Malawi. Any dispute arising from these Terms or your use of the website shall first be attempted to be resolved through good faith negotiation. If not resolved within 30 days, either party may submit the dispute to the <strong>Competition and Fair Trading Commission (CFTC)</strong> of Malawi for mediation or to the courts of Malawi in Lilongwe or Blantyre, at our discretion.</p>

    <h2>13. Changes to These Terms</h2>
    <p>We may update these Terms at any time. The "Last Updated" date indicates the latest version. Continued use of the website after changes means you accept the revised Terms. For material changes, we will notify you via email or a prominent notice on the website.</p>

    <h2>14. Contact Information</h2>
    <p>For any questions, complaints, or to exercise your rights, contact us at:<br/>
    <strong>Email:</strong> <a href="mailto:spectrumcosmo01@gmail.com">spectrumcosmo01@gmail.com</a><br/>
    <strong>Physical addresses:</strong> Lilongwe and Blantyre, Malawi</p>

    <h2>15. Entire Agreement</h2>
    <p>These Terms constitute the entire agreement between you and SpectrumCosmo regarding your use of the website and supersede any prior agreements. If any provision is found unenforceable, the remaining provisions remain in full force.</p>
  `;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12 bg-white dark:bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last Updated: {new Date(lastUpdated).toLocaleDateString()}
        </p>
        <div 
          className="prose prose-gray max-w-none leading-relaxed dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </main>
      <Footer />
    </>
  );
}
