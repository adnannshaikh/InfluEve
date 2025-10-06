/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: {
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          fg: 'hsl(var(--brand-fg))',
          muted: 'hsl(var(--brand-muted))',
        },
        bg: 'hsl(var(--bg))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        text: 'hsl(var(--text))',
        soft: 'hsl(var(--soft))',
      },
      boxShadow: { soft: '0 10px 25px -10px rgba(0,0,0,.15)' },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
