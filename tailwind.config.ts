import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        lightGreen: 'rgb(95,206,114)',
        lightWhite: '#F4F4F7',
        textBlackColor: 'rgba(0,0,0,0.7)',
        textGrayColor: 'rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
export default config
