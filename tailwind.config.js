/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1E1E1E',
        'darker-bg': '#0F0F0F',
        'accent-mint': 'rgb(119, 241, 190)',
        'status-subscribed': 'rgb(38, 100, 49)',
        'status-full': '#5D5757',
        'status-available': '#c3161675',
      },
      fontFamily: {
        'koulen': ['Koulen', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'display': '4.5em',
      },
      letterSpacing: {
        'display': '15px',
      },
      borderRadius: {
        'card-sm': '10px',
        'card-md': '20px',
        'card-lg': '40px',
      },
      boxShadow: {
        'card': '10px 7px 4px rgba(0, 0, 0, 0.107)',
      },
      zIndex: {
        'header': '999',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
}