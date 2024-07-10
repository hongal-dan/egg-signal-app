/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        Jalnan: ["Jalnan", "sans-serif"],
        nanum: ["Nanum Gothic", "sans-serif"],
      },
    },
  },
  plugins: [],
};
