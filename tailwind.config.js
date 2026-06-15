module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "contix-primary": "#C79A4A",
        "contix-dark": "#222831",
        "contix-success": "#00C853",
        "contix-gray": "#6B7280",
        "contix-light": "#F8F7F4"
      }
    }
  },
  plugins: []
};
