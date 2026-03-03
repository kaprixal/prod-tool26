/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    fontFamily: {
      built: ['BuiltTilting', 'sans-serif'],
      integral: ['IntegralCF', 'sans-serif'],
      sans: ['Arial', 'sans-serif'],
    },
    extend: {},
  },
  plugins: [],
};
