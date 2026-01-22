/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Dark Navy + Steel Blue Theme
        brand: {
          primary: '#0B1C2D',    // Deep Navy
          secondary: '#1F3A5F',  // Steel Blue
          accent: '#3B82F6',     // Enterprise Blue
        },
        surface: {
          light: '#F8FAFC',      // Soft White
          dark: '#020617',       // Near Black
          card: '#0F172A',       // Card Background
        },
        text: {
          primary: '#0F172A',    // Primary Text
          muted: '#64748B',      // Muted Text
        },
        border: '#E2E8F0',       // Border Color
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0B1C2D 0%, #1F3A5F 100%)',
        'gradient-accent': 'linear-gradient(135deg, #3B82F6 0%, #1F3A5F 100%)',
      },
      boxShadow: {
        'brand': '0 4px 6px -1px rgba(11, 28, 45, 0.1), 0 2px 4px -1px rgba(11, 28, 45, 0.06)',
        'brand-lg': '0 10px 15px -3px rgba(11, 28, 45, 0.1), 0 4px 6px -2px rgba(11, 28, 45, 0.05)',
      }
    },
  },
  plugins: [],
}
