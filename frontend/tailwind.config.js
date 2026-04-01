/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        // CEX.IO coral accent
        brand: {
          primary: '#EE8267',    // CEX.IO coral CTA
          secondary: '#E55D4E',  // Darker coral active
          hover: '#F4927E',      // Lighter coral hover
        },
        // CEX.IO light theme
        light: {
          bg: '#f2f3f5',         // Main background
          card: '#ffffff',       // Card / panel background
          card2: '#f7f8fa',      // Secondary card
          border: '#E8EAED',     // Border
          hover: '#f0f1f3',      // Hover state
          input: '#f2f3f5',      // Input background
        },
        // CEX.IO dark / header
        dark: {
          bg: '#0E2026',         // Footer / hero dark
          header: '#ffffff',     // Header white
          teal: '#185B64',       // Teal gradient start
          teal2: '#114147',      // Teal gradient end
        },
        green: {
          trade: '#0ECB81',
        },
        red: {
          trade: '#f6465d',
        },
        text: {
          primary: '#0E2026',    // Dark navy text
          secondary: '#566367',  // Muted secondary
          muted: '#9BA3A6',      // Very muted
          inverse: '#ffffff',    // White for dark backgrounds
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-left': 'slideLeft 0.25s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'ticker': 'ticker 40s linear infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
