/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#fff9f5',
          100: '#fff3eb',
          200: '#ffe4d1',
          300: '#ffcea5',
          400: '#ffaa6c',
          500: '#ff8a3d',
          600: '#f06c1a',
          700: '#c7500c',
          800: '#a3400e',
          900: '#863713',
          950: '#481a07',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        cute: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
