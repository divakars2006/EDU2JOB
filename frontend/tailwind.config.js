/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7', // Primary Blue
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49', // Darkest Blue
                },
                dark: {
                    bg: '#0a0a0f', // Deep dark mode
                    surface: '#0f172a',
                }
            },
            fontFamily: {
                sans: ['"Inter"', 'system-ui', 'sans-serif'],
            },
            animation: {
                'blob': 'blob 7s infinite',
                'marquee': 'marquee 25s linear infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                }
            }
        },
    },
    corePlugins: {
        preflight: false, // Keeping false as per previous constraint to avoid breaking other pages
    },
    plugins: [],
}
