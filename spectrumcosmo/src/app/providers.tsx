'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Export ThemeProvider for backward compatibility with your layout
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        {children}
      </NextThemesProvider>
    </GoogleOAuthProvider>
  );
}

// Also export as Providers for flexibility
export { ThemeProvider as Providers };
