# SpectrumCosmo

SpectrumCosmo is an e‑commerce platform for anime‑inspired apparel and merchandise, built with Next.js, PostgreSQL (Neon), and Tailwind CSS.

## Features

- Product catalog with categories, search, and responsive grid
- Shopping cart with dynamic currency conversion
- User accounts (sign up, login, profile, order history)
- Checkout with delivery method selection and payment proof upload
- Admin dashboard for managing products, orders, and payment options
- Contact form with email notifications (Nodemailer)
- Mobile‑friendly design with dark mode support

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide icons
- **Backend:** Next.js API routes, PostgreSQL (Neon)
- **Authentication:** JWT (custom), bcrypt
- **Email:** Nodemailer (SMTP)
- **Payments:** Manual proof upload (admin approval)
- **Deployment:** Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon, Supabase, or local)
- SMTP credentials for email (Gmail, Outlook, etc.)
- Cloudinary account (for image uploads)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database (Neon provides POSTGRES_URL)
POSTGRES_URL=postgresql://...

# JWT Authentication (generate a random 32+ character string)
JWT_SECRET=your_super_secret_long_random_string

# Admin credentials (use strong values, not defaults)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_admin_password

# SMTP for contact form (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CONTACT_EMAIL=admin@yourdomain.com

# Cloudinary (for order proof uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
