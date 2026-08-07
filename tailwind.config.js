/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2727d6',
        'primary-dark': '#1b1b9e',
        'primary-light': '#4e9af1',
        surface: '#e8f0fe',
        'surface-alt': '#d6e3f8',
        ink: '#000000',
        muted: '#666666',
        faint: '#999999',
        line: '#cccccc',
        canvas: '#f5f5f5',
        danger: '#2727d6',
        success: '#1db954',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
      fontFamily: {
        sans: ['Satoshi', 'System'],
        satoshi: ['Satoshi', 'System'],
        'satoshi-medium': ['Satoshi-Medium', 'System'],
        'satoshi-bold': ['Satoshi-Bold', 'System'],
      },
    },
  },
  plugins: [],
};
