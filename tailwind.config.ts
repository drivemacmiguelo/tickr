import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:     'var(--bg)',
        bg2:    'var(--bg2)',
        bg3:    'var(--bg3)',
        bg4:    'var(--bg4)',
        green:  'var(--green)',
        red:    'var(--red)',
        blue:   'var(--blue)',
        amber:  'var(--amber)',
        muted:  'var(--muted)',
        muted2: 'var(--muted2)',
      },
    },
  },
  plugins: [],
}
export default config
