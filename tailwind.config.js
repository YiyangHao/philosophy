/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: '#007AFF',
          light: '#5AC8FA',
          dark: '#0051D5',
        },
        // Status colors
        success: {
          DEFAULT: '#34C759',
          light: '#30D158',
          dark: '#248A3D',
        },
        warning: {
          DEFAULT: '#FF9500',
          light: '#FFB340',
          dark: '#C77700',
        },
        danger: {
          DEFAULT: '#FF3B30',
          light: '#FF6961',
          dark: '#D70015',
        },
        // Background colors
        'bg-main': {
          DEFAULT: '#FFFFFF',
          dark: '#000000',
        },
        'card-bg': {
          DEFAULT: '#F2F2F7',
          dark: '#1C1C1E',
        },
        // Border colors
        border: {
          DEFAULT: '#D1D1D6',
          dark: '#38383A',
        },
        // Text colors
        'text-primary': {
          DEFAULT: '#000000',
          dark: '#FFFFFF',
        },
        'text-secondary': {
          DEFAULT: '#6E6E73',
          dark: '#98989D',
        },
        // Tag colors (for categorization)
        tag: {
          blue: '#007AFF',
          green: '#34C759',
          yellow: '#FFD60A',
          orange: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
          pink: '#FF2D55',
          gray: '#8E8E93',
        },
      },
      boxShadow: {
        'card-custom': '0 29px 18px rgba(20, 18, 103, 0.03), 0 2px 20px rgba(23, 58, 110, 0.06)',
      },
      fontFamily: {
        // Apple system fonts
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
