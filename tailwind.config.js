/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#08B6FC',
        'primary-dark': '#034965',
        'primary-light': '#84dbfe',
        'primary-pressed': '#0692ca',
        surface: '#e6f8ff',
        'surface-alt': '#cef0fe',
        'surface-elevated': '#ffffff',
        ink: '#000000',
        muted: '#666666',
        faint: '#8a8a8a',
        'text-disabled': '#b0b0b0',
        line: '#cccccc',
        canvas: '#f5f5f5',
        divider: '#f0f0f0',
        danger: '#dc2626',
        'danger-bg': '#fef2f2',
        success: '#059669',
        'success-bg': '#ecfdf5',
        warning: '#b45309',
        'warning-bg': '#fff9e6',
        info: '#3b82f6',
        'info-bg': '#eff6ff',
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
