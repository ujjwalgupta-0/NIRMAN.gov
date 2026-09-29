module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gov: { 900: "#0a3d38", 800: "#0c4c45", 700: "#0e6057", 100: "#d9eeeb" },
        ink: { 900: "#0f172a", 700: "#334155", 500: "#64748b", 200: "#e2e8f0", 100: "#f1f5f9" },
        risk: { green: "#15803d", amber: "#b45309", red: "#b91c1c" }
      },
      fontFamily: { sans: ["Inter", "Segoe UI", "Arial", "sans-serif"] }
    }
  },
  plugins: []
};
