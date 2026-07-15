/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          350: '#68e796',
          400: '#4ade80',
          450: '#36d16f',
          550: '#10b981', // Emerald / Brand green
          500: '#22c55e',
          600: '#16a34a',
          650: '#169148',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        accent: {
          orange: '#f97316',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        // The design throughout this app uses half-step shades (e.g.
        // slate-450, slate-850) between Tailwind's default 100-unit stops.
        // Tailwind's default palettes only define the standard stops, so
        // every dark:/text-/bg- utility referencing these half-steps was
        // silently generating no CSS at all — invisible on most <div>s
        // (they just show a dark parent through), but very visible on
        // native form controls like <select>, which fall back to their own
        // default (usually light) background instead. These fill in exactly
        // the half-steps actually used in the codebase, interpolated between
        // the neighboring default Tailwind stops.
        slate: {
          150: '#e9eef4',
          250: '#d6dee8',
          350: '#afbccc',
          450: '#7c8ba1',
          550: '#55647a',
          650: '#3d4b5f',
          750: '#29354a',
          850: '#172033',
        },
        emerald: {
          550: '#0aa775',
        },
        amber: {
          350: '#fbc939',
          450: '#f8ae18',
          550: '#e78a09',
        },
        rose: {
          450: '#f85872',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
