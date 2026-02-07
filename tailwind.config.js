
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    // Highlight Colors
    'bg-indigo-600', 'bg-orange-400', 'bg-slate-300', 'bg-white',
    'border-indigo-800', 'border-orange-600', 'border-slate-400', 'border-slate-200',
    'text-white', 'text-slate-900', 'text-slate-800',
    'ring-indigo-200', 'ring-2', 'z-10', 'scale-110', 'scale-105',
    'shadow-[0_4px_12px_rgba(79,70,229,0.5)]',
    'shadow-[0_2px_10px_rgba(251,146,60,0.4)]',
    // Day Themes
    'bg-red-600', 'bg-yellow-400', 'bg-pink-500', 'bg-green-600', 'bg-orange-500', 'bg-sky-400', 'bg-purple-600',
    'text-red-600', 'text-yellow-600', 'text-pink-600', 'text-green-600', 'text-orange-600', 'text-sky-600', 'text-purple-600',
    'border-red-100', 'border-yellow-100', 'border-pink-100', 'border-green-100', 'border-orange-100', 'border-sky-100', 'border-purple-100'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
