/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Police theme colors
        police: {
          blue: {
            light: "#4299e1", // Light blue
            DEFAULT: "#2b6cb0", // Standard police blue
            dark: "#1a4571",   // Dark blue
          },
          accent: {
            red: "#e53e3e",    // For alerts and important notifications
            gold: "#d69e2e",   // For badges and special elements
          },
          gray: {
            light: "#f7fafc",
            DEFAULT: "#e2e8f0",
            dark: "#4a5568",
          },
          text: {
            light: "#f7fafc",   // Light text (for dark backgrounds)
            DEFAULT: "#2d3748",  // Standard text
            dark: "#1a202c",     // Dark text (for light backgrounds)
            muted: "#718096",    // Muted text (for secondary information)
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.5s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};


