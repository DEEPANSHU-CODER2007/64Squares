/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#101311',
          bgSecondary: '#171B18',
          card: '#1D231F',
          surface: '#252C27',
          text: '#F4F3EA',
          textSecondary: '#A5ADA5',
          accent: '#81B64C',
          accentHover: '#91C85A',
          border: '#303831',
          error: '#E35D5B',
          warning: '#E8B45B',
          // Light theme
          lightBg: '#F5F5F0',
          lightSurface: '#FFFFFF',
          lightText: '#20251F',
          lightTextSecondary: '#687168',
          lightAccent: '#557F39',
          lightBorder: '#E4E7E1',
        },
        board: {
          light: '#E8E4D8',
          dark: '#779866',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};

