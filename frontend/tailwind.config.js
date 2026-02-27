module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3981F7', // Primary
          300: '#7DABF6',
          100: '#CFE1FF',
        },
        secondary: {
          DEFAULT: '#0A112F', // Secondary 500
          500: '#0A112F',
          300: '#222B50',
          100: '#636EA0',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F4F4F6',
          200: '#E5E6EB',
          300: '#D3D5DA',
          400: '#9EA3AE',
          500: '#6C727F',
          600: '#4D5461',
          700: '#394150',
          800: '#212936',
          900: '#161D21',
        }
      }
    },
  },
  plugins: [],
}
