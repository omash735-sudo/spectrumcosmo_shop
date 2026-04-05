import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { orange: '#F97316', peach: '#FDBA74', black: '#111111', gray: '#6B7280' },
      },
    },
  },
  plugins: [],
}
export default config
