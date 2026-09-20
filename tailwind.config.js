/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        grafana: {
          bg: '#111217',
          panel: '#181b1f',
          header: '#22252b',
          card: '#16171b',
          border: '#26292e',
          'border-light': '#343840',
          hover: '#24272e',
          text: '#d8d9da',
          muted: '#8e8e99',
          darkmuted: '#52545c',
          green: '#73BF69',
          'green-light': '#96D98D',
          blue: '#5794F2',
          'blue-light': '#8AB8FF',
          yellow: '#FADE2A',
          orange: '#FF9830',
          red: '#F2495C',
          purple: '#B877D9',
          cyan: '#56C5DB'
        }
      },
      fontFamily: {
        mono: ['Roboto Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
