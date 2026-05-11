export const dynamic = 'force-dynamic';

import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Image from 'next/image';

export default async function NewsletterPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !verifyToken(token)) redirect('/admin/login');

  const sql = getDb();

  // Use the correct table name: newsletter_campaigns
  const [newsletter] = await sql`
    SELECT * FROM newsletter_campaigns WHERE id = ${params.id}
  `;

  if (!newsletter) {
    return (
      <div className="p-6 text-gray-500">
        Newsletter not found
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">
      <h1 className="text-2xl font-bold text-[#111111] mb-2">
        {newsletter.title}
      </h1>

      <p className="text-sm text-gray-400 mb-4">
        Audience: {newsletter.audience} | Status: {newsletter.status}
      </p>

      {newsletter.image_url && (
        <div className="relative w-full h-64 mb-4 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src={newsletter.image_url}
            alt={newsletter.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div
        className="text-gray-700 mb-6 prose max-w-none"
        dangerouslySetInnerHTML={{ __html: newsletter.content }}
      />

      <div className="flex gap-3">
        <form
          action={async () => {
            'use server';
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: newsletter.id }),
            });
            redirect('/admin/newsletter');
          }}
        >
          <button
            type="submit"
            className="bg-[#F97316] text-white px-4 py-2 rounded"
          >
            Send Now
          </button>
        </form>

        <a
          href="/admin/newsletter"
          className="bg-gray-200 text-black px-4 py-2 rounded"
        >
          Back
        </a>
      </div>
    </div>
  );
}
