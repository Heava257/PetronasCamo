/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ប្រើ class strategy សម្រាប់ dark mode
  theme: {
    extend: {
      colors: {
        // Custom colors for your theme
        petronas: {
          primary: '#00A19C',
          dark: '#1a1a2e',
          light: '#f8f9fa',
        }
      }
    },
  },
  plugins: [],
}