// tailwind-unlist.js

module.exports = function ({ addBase }) {
    addBase({
      'ul, ol': {
        listStyleType: 'disc',
        listStylePosition: 'outside',
        listStyleImage: 'none',
      }
    });
  };