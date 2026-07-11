import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
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
    },
  },
  plugins: [],
}

export default config
