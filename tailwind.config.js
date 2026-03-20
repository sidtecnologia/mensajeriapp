/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Definimos "ttraigo" como tu familia de colores oficial
        ttraigo: {
          DEFAULT: '#0c6839', // Tu color primario
          light: '#e6f0eb',   // Un verde muy pálido para fondos de tarjetas
          medium: '#118a4c',  // Un verde un poco más vivo para hovers
          dark: '#063a20',    // Un verde casi negro para textos importantes
        },
      },
    },
  },
  plugins: [],
}