/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF8EE',
          100: '#F5EED3',
          200: '#EBDBA3',
          300: '#E0C773',
          400: '#D6B443',
          500: '#D4AF37', // Dorado principal 5 estrellas
          600: '#B89326',
          700: '#8C6F1D',
          800: '#5F4B13',
          900: '#33280A',
        },
      },
    },
  },
  plugins: [],
}
