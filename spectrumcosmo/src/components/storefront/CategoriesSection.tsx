import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import { FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import CategoriesScroll from './CategoriesScroll';

export default async function CategoriesSection() {
  const sql = getDb();
  const categories = await sql`
    SELECT id, name, slug, image_url, is_active, sort_order
    FROM categories 
    WHERE is_active = true 
    ORDER BY sort_order ASC, name ASC
  `;
  if (categories.length === 0) return null;

  return <CategoriesScroll categories={categories} />;
}
