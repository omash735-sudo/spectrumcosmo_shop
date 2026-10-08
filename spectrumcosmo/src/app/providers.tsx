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
        defaultTheme="light"
        // ------------------------------------------------------------
        // TEMPORARY: dark mode is disabled for now.
        // The .dark token block in globals.css is kept intact, and the
        // ThemeSwitcher component still works — it just can't activate
        // a dark UI while forcedTheme is set.
        //
        // TO RE-ENABLE DARK MODE LATER:
        //   - delete  forcedTheme="light"
        //   - change  enableSystem={false}  →  enableSystem={true}
        //   - (optional) change defaultTheme back to "system"
        // ------------------------------------------------------------
        forcedTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        {children}
      </NextThemesProvider>
    </GoogleOAuthProvider>
  );
}

// Also export as Providers for flexibility
export { ThemeProvider as Providers };
