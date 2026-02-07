/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mercadoGreen: '#2e7d32',   // Verde carregado para o tema
        mercadoYellow: '#f9d71c',  // Amarelo suave para detalhes
      },
      fontWeight: {
        extraBold: '800',           // Peso extra para títulos
      },
    },
  },
  plugins: [],
};
