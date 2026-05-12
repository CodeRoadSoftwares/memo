/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wa-primary': '#075e54',
        'wa-accent': '#25d366',
        'wa-teal': '#128c7e',
      },
      fontFamily: {
        title: ['Outfit', 'sans-serif'],
        fancy: ['Playfair Display', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'magical': '0 30px 60px -12px rgba(0,0,0,0.08), 0 18px 36px -18px rgba(0,0,0,0.1)',
        'glow': '0 40px 80px -15px rgba(18, 140, 126, 0.12)',
      },
      keyframes: {
        floatAround: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(5vw, 5vh) scale(1.1)' },
          '100%': { transform: 'translate(-2vw, 10vh) scale(0.9)' },
        },
        bob: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        floatAround: 'floatAround 20s infinite ease-in-out alternate',
        bob: 'bob 6s infinite ease-in-out alternate',
      }
    },
  },
  plugins: [],
}

