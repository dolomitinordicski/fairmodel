/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dns: {
          deep: '#0D4D5E',
          mid: '#417483',
          light: '#AAD0D1',
          lighter: '#E0F0F0',
          gray: '#f5f7f8',
          border: '#d0e4e5',
          text: '#1a2e33',
          muted: '#5a7a82',
          accent: '#e8f4f4',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
        display: ['Be Vietnam Pro', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};