/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          dark: '#4338ca',    // Indigo 700
          light: '#818cf8',   // Indigo 400
        },
        secondary: {
          DEFAULT: '#06b6d4', // Cyan 500
        },
        surface: {
          DEFAULT: '#ffffff',
          glass: 'rgba(255, 255, 255, 0.7)',
        },
        background: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
