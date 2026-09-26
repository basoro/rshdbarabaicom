/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    fontFamily: {
      sans: ['Inter', 'Arial', 'sans-serif'],
      display: ['Inter', 'Arial', 'sans-serif'],
      serif: ['Inter', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    extend: {
      keyframes: {
        backdropFadeIn: {
          '0%': { opacity: '0', backdropFilter: 'blur(0px)' },
          '100%': { opacity: '1', backdropFilter: 'blur(4px)' },
        },
        backdropFadeOut: {
          '0%': { opacity: '1', backdropFilter: 'blur(4px)' },
          '100%': { opacity: '0', backdropFilter: 'blur(0px)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.96)' },
          '60%': { opacity: '1', transform: 'translateY(-1px) scale(1.005)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        popOut: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
        },
      },
      animation: {
        'backdrop-in': 'backdropFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'backdrop-out': 'backdropFadeOut 260ms cubic-bezier(0.4, 0, 1, 1) both',
        'pop-in': 'popIn 380ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-out': 'popOut 260ms cubic-bezier(0.4, 0, 1, 1) both',
      },
    },
  },
  plugins: [],
};
