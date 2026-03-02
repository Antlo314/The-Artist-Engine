/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                studio: {
                    900: '#121212',
                    800: '#1e1e1e',
                    700: '#2d2d2d',
                    dark: '#0a0a0a',
                    accent: '#00f0ff',
                    neon: '#ff003c',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
