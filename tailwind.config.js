/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    blue: '#4F7BFE',
                    dark: '#2E3A45',
                    light: '#F4F6F8'
                }
            }
        },
    },
    plugins: [],
}
