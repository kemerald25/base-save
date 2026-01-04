import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'royale-blue': '#0052FF',
        'royale-blue-dark': '#0033CC',
        'royale-cyan': '#00D4FF',
        'royale-background': '#0A0B0D',
        'royale-card': '#141519',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        'royale-glow': '0px 25px 80px rgba(0, 82, 255, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
