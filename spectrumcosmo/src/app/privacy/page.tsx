export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';

export default async function PrivacyPage() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'privacy'`;
  const content = row?.content || {};

  // Fallback to your existing detailed content if nothing in DB
  const title = content.title || 'Privacy Policy';
  const lastUpdated = content.last_updated || '2026-05-09';
  const htmlContent = content.content || `
    <h2>1. Introduction</h2>
    <p>SpectrumCosmo (“we”, “us”, “our”) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. It complies with the Malawi Data Protection Act (No. 21 of 2021) and applies to all customers in Malawi and across Africa.</p>

    <h2>2. Data Controller Contact</h2>
    <p>SpectrumCosmo is the data controller responsible for your personal data.<br/>
    <strong>Email:</strong> <a href="mailto:spectrumcosmo01@gmail.com">spectrumcosmo01@gmail.com</a><br/>
    <strong>Physical addresses:</strong> Lilongwe, Malawi &amp; Blantyre, Malawi<br/>
    (For any privacy inquiries, please use the email above.)</p>

    <h2>3. Information We Collect</h2>
    <p>We collect and process the following categories of personal data:</p>
    <ul><li>Name and contact details (including phone number and email)</li><li>Delivery address and location</li><li>Order history and transaction details</li><li>Payment information (processed via Airtel Money, Mpamba, or bank transfers – we do not store full payment credentials)</li><li>Device and usage data (IP address, browser type, pages visited)</li></ul>

    <h2>4. How We Use Your Data</h2>
    <p>We use your information for the following purposes, based on the legal bases of <strong>contract performance</strong> and <strong>legitimate interests</strong>:</p>
    <ul><li>Process and fulfil your orders (including payment verification via Airtel Money, Mpamba, or bank partners)</li><li>Communicate order updates and customer support</li><li>Improve our services and website functionality</li><li>Prevent fraud and ensure security</li><li>Comply with legal obligations (e.g., tax records)</li></ul>

    <h2>5. Legal Basis for Processing (Malawi Data Protection Act)</h2>
    <p>Under the Malawi Data Protection Act, we rely on: (a) performance of a contract with you (e.g., processing your order); (b) our legitimate interests (e.g., improving security and customer service); and (c) compliance with legal obligations. We do not sell your personal data to third parties.</p>

    <h2>6. Sharing Your Data (Third Parties)</h2>
    <p>We share your data only as necessary with the following categories of recipients:</p>
    <ul><li><strong>Payment processors:</strong> Airtel Money, Mpamba, and bank integration partners (to complete transactions)</li><li><strong>Hosting and cloud providers:</strong> Our servers are located outside Africa (see Section 8 below)</li><li><strong>Delivery and logistics:</strong> Couriers who need your address to deliver products</li><li><strong>Legal authorities:</strong> If required by Malawian law or to protect our rights</li></ul>
    <p>We require all third parties to respect the security of your data and to process it only on our instructions.</p>

    <h2>7. Data Retention</h2>
    <p>We retain your personal data for as long as your account is active or as needed to provide you with services. Order history is retained for <strong>7 years</strong> to comply with Malawian tax and consumer protection laws. After that, we securely delete or anonymise your data. You may request earlier deletion (see Section 10).</p>

    <h2>8. International Data Transfers</h2>
    <p>Our website is hosted on servers located outside Africa (e.g., in the United States or Europe). When we transfer your personal data outside Malawi, we ensure that an adequate level of protection is provided, either because the receiving country has equivalent data protection laws or because we use standard contractual clauses approved by the Malawi Data Protection Authority. By using our website, you acknowledge and consent to this transfer.</p>

    <h2>9. Security Measures</h2>
    <p>We implement industry-standard safeguards, including SSL/TLS encryption for data transmission, restricted access to personal data, and regular security reviews. However, no electronic transmission or storage is 100% secure. If a data breach occurs that is likely to harm your rights, we will notify you and the Malawi Data Protection Authority within 72 hours as required by law.</p>

    <h2>10. Your Privacy Rights (Malawi Data Protection Act)</h2>
    <p>You have the following rights regarding your personal data:</p>
    <ul><li><strong>Right to access</strong> – receive a copy of your data we hold</li><li><strong>Right to rectification</strong> – correct inaccurate or incomplete data</li><li><strong>Right to erasure</strong> (“right to be forgotten”) – delete your data, subject to legal retention obligations</li><li><strong>Right to restriction of processing</strong> – limit how we use your data</li><li><strong>Right to data portability</strong> – receive your data in a structured, machine-readable format</li><li><strong>Right to object</strong> – object to processing based on legitimate interests</li><li><strong>Right to withdraw consent</strong> – where consent is required (e.g., marketing)</li></ul>
    <p>To exercise any of these rights, contact us at <a href="mailto:spectrumcosmo01@gmail.com">spectrumcosmo01@gmail.com</a>. We will respond within 30 days as required by Malawian law. There is no fee for most requests, but we may charge a reasonable fee for manifestly unfounded or excessive requests.</p>

    <h2>11. Beta Notice</h2>
    <p>This platform is currently in beta testing. While we take privacy and security seriously, you may experience bugs, temporary interruptions, or changes to features without prior notice. We will notify you of significant changes to this Privacy Policy via email or a notice on our website.</p>

    <h2>12. Changes to This Privacy Policy</h2>
    <p>We may update this policy from time to time. The “Last Updated” date at the top indicates when changes were made. Continued use of our website after changes constitutes acceptance of the revised policy. For material changes, we will obtain your consent if required by law.</p>

    <h2>13. Contact and Complaints</h2>
    <p>For any privacy-related questions, requests, or complaints, please email us at <a href="mailto:spectrumcosmo01@gmail.com">spectrumcosmo01@gmail.com</a>. If you are not satisfied with our response, you have the right to lodge a complaint with the <strong>Malawi Data Protection Authority</strong>.</p>
  `;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12 bg-white">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date(lastUpdated).toLocaleDateString()}</p>
        <div className="prose max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </main>
      <Footer />
    </>
  );
}
