/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        figtree: {
          regular: 'Figtree-Regular',
          medium: 'Figtree-Medium',
          bold: 'Figtree-Bold',
          semiBold: 'Figtree-SemiBold',
          extraBold: 'Figtree-ExtraBold',
        }
      },
      colors: {
        // Light Theme Colors
        // Primary: '#21965B',
        Primary: '#0ea5e9',
        Secondary: 'rgb(31, 134, 83)',
        Background: '#FFFFFF',
        Surface: '#F5F5F5',
        OnPrimary: '#FFFFFF',
        OnSecondary: '#FFFFFF',
        OnBackground: '#000000',
        OnSurface: '#000000',
        TextPrimary: '#000000',
        TextSecondary: '#707070',
        
        // Dark Theme Colors
        // PrimaryDark: '#21965B',
        PrimaryDark: '#0ea5e9',
        SecondaryDark: 'rgb(25, 110, 68)',
        BackgroundDark: '#0F172A',
        SurfaceDark: '#1E293B',
        OnPrimaryDark: '#000000',
        OnSecondaryDark: '#000000',
        OnBackgroundDark: '#FFFFFF',
        OnSurfaceDark: '#FFFFFF',
        TextPrimaryDark: '#FFFFFF',
        TextSecondaryDark: '#B0B0B0',
      },
    },
  },
  plugins: [],
};


// **Tailwind Color Palette with Hex Values**

// **Red**

// * red-50: `#fef2f2`
// * red-100: `#fee2e2`
// * red-200: `#fecaca`
// * red-300: `#fca5a5`
// * red-400: `#f87171`
// * red-500: `#ef4444`
// * red-600: `#dc2626`
// * red-700: `#b91c1c`
// * red-800: `#991b1b`
// * red-900: `#7f1d1d`
// * red-950: `#450a0a`

// **Sky**

// * sky-50: `#f0f9ff`
// * sky-100: `#e0f2fe`
// * sky-200: `#bae6fd`
// * sky-300: `#7dd3fc`
// * sky-400: `#38bdf8`
// * sky-500: `#0ea5e9`
// * sky-600: `#0284c7`
// * sky-700: `#0369a1`
// * sky-800: `#075985`
// * sky-900: `#0c4a6e`
// * sky-950: `#082f49`

// **Green**

// * green-50: `#f0fdf4`
// * green-100: `#dcfce7`
// * green-200: `#bbf7d0`
// * green-300: `#86efac`
// * green-400: `#4ade80`
// * green-500: `#22c55e`
// * green-600: `#16a34a`
// * green-700: `#15803d`
// * green-800: `#166534`
// * green-900: `#14532d`
// * green-950: `#052e16`

// **Slate**

// * slate-50: `#f8fafc`
// * slate-100: `#f1f5f9`
// * slate-200: `#e2e8f0`
// * slate-300: `#cbd5e1`
// * slate-400: `#94a3b8`
// * slate-500: `#64748b`
// * slate-600: `#475569`
// * slate-700: `#334155`
// * slate-800: `#1e293b`
// * slate-900: `#0f172a`
// * slate-950: `#020617`
