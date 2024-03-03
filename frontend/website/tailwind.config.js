const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

// Define for ul and ol styles
function applyListStyles({ addBase }) {
  addBase({
    'ul': {
      listStyleType: 'disc',
      listStylePosition: 'outside',
      listStyleImage: 'none',
    },
    'ol': {
      listStyleType: 'decimal', // Use 'decimal' for numbered lists
      listStylePosition: 'outside',
      listStyleImage: 'none',
    }
  });
}

module.exports = {
  mode: "jit",
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", //
  theme: {
    extend: {
      colors: {
        trueGray: colors.neutral,
      }
    },
    fontFamily: {
      sans: ["Inter", ...defaultTheme.fontFamily.sans],
      stock: [defaultTheme.fontFamily.sans],
    },
    // fontFamily: {
    //   sans: ["var(--font-sans)", ...fontFamily.sans],
    // },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/aspect-ratio"), applyListStyles],
};
