module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#FF0000', // Custom primary color
        secondary: '#00FF00', // Custom secondary color
      },
    },
  },
  plugins: [],
};