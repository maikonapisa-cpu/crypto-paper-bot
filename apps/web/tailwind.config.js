/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#18181b',
        panel:   '#1c1c20',
        border:  '#2d2d33',
        buy:     '#10b981',
        sell:    '#f43f5e',
        muted:   '#71717a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
