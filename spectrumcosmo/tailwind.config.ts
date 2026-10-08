import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // kept in case src/ is used anywhere
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Backgrounds
          black: '#111111',
          charcoal: '#1B1B1B',
          card: '#232323',

          // Accents
          orange: '#C96712',
          orangeHover: '#E27716',

          // Text
          white: '#F5F5F5',
          gray: '#9A9A9A',

          // Borders
          border: '#343434',
        },
      },
      // ------------------------------------------------------------
      // Typography system.
      // These route Tailwind font utilities through the CSS variables
      // composed in app/globals.css, which in turn point at the
      // next/font variables registered in app/layout.tsx.
      //
      //   font-sans     → Kanit (UI font: body, nav, buttons, forms)
      //   font-ui       → same as font-sans, semantic alias
      //   font-display  → Anton  (h1 / hero only)
      //   font-promo    → Bangers (opt-in marketing accents only)
      // ------------------------------------------------------------
      fontFamily: {
        sans:    ['var(--font-body)'],
        ui:      ['var(--font-ui)'],
        display: ['var(--font-display)'],
        promo:   ['var(--font-promo)'],
      },
    },
  },
  plugins: [],
}

export default config
