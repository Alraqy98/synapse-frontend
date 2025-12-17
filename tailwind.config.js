/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00C8B4',
          neon: '#00F5CC',
          dim: 'rgba(0, 200, 180, 0.10)',
        },
        blue: {
          DEFAULT: '#3F7CFF',
          dim: 'rgba(63, 124, 255, 0.15)',
        },
        purple: '#7A6CFF',
        void: '#0D0F12',
        panel: 'rgba(25, 29, 34, 0.68)',
        muted: 'rgba(245, 245, 247, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
